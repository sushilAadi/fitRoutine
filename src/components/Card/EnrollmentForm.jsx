import React, { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { GlobalContext } from "@/context/GloablContext";
import InputBlk from "../InputCs/InputBlk";
import TextBlk from "../InputCs/TextArea";
import FileUpload from "../FileUpload";
import { useFileUpload } from "@/hooks/useFileUpload";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import toast from "react-hot-toast";
import SecurePaymentComponent from "../SecurePaymentComponent";
import { sendEnrollmentNotifications } from "@/services/notificationService";

const EnrollmentForm = ({ mentor, rateOptions, timeSlots, availableDays }) => {
  const router = useRouter();
  const { user, userDetailData,latestWeight } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [hour, setHour] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: Payment
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const {
    handleFileUpload: handleProfileUpload,
    handleFileDelete: handleProfileDelete,
    fileData: profileData,
    totalSizeInMB: profileSize,
  } = useFileUpload(["image/jpeg", "image/png"], 1, {
    single: true,
    multiple: false,
    append: false,
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    phoneNumber: "",
    availability: {
      days: [],
      timeSlot: "",
    },
    rateType: "",
    biography: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  
  const uploadImageToCloudinary = async (base64Data, fileName) => {
    if (!base64Data) {
      toast.error("No image data provided");
      return null;
    }

    try {
      // Check if base64Data is proper
      if (!base64Data.startsWith("data:image/")) {
        throw new Error("Invalid image format");
      }

      const formData = new FormData();
      formData.append("file", base64Data);
      formData.append("upload_preset", "ml_default");
      formData.append("folder", "client-enrollment");
      formData.append("public_id", `${userDetailData?.userIdCl}/${fileName}`);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error?.message || "Upload failed");
      }

      const data = await uploadResponse.json();

      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error("No secure URL in response");
      }
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
  };

  const validateForm = () => {
    if (!profileData?.base64Data) {
      toast.error("Profile photo is required");
      return false;
    }
    if (!formData.fullName || !formData.phoneNumber || !formData.biography) {
      toast.error("All fields are required");
      return false;
    }
    if (
      formData.availability.days.length === 0 ||
      !formData.availability.timeSlot
    ) {
      toast.error("Please select your availability");
      return false;
    }
    if (!formData.rateType) {
      toast.error("Please select a rate plan");
      return false;
    }
    // Add validation for hourly rate if hourly option is selected
    if (formData.rateType === "hourly" && !hour) {
      toast.error("Please enter your hourly rate");
      return false;
    }
    if (selectedLocations.length === 0) {
      toast.error("Please select at least one training location");
      return false;
    }
    if (!selectedLocations) {
      toast.error("Please select a training location");
      return false;
    }
    return true;
  };
  


  const prepareEnrollmentData = async () => {
    if (!validateForm()) return false;

    setLoading(true);
    const loadingToast = toast.loading("Preparing enrollment...");

    try {
      const fileName = `profile-${Date.now()}`;
      const imageUrl = await uploadImageToCloudinary(
        profileData.base64Data,
        fileName
      );

      if (!imageUrl) {
        throw new Error("Failed to upload image");
      }

      // Calculate the rate based on whether it's hourly or not
      const selectedRate = formData.rateType === "hourly" 
        ? Number(hour) + 1 
        : rateOptions.find((opt) => opt.id === formData.rateType)?.rate;

      // Validate selectedRate
      if (!selectedRate || isNaN(selectedRate) || selectedRate <= 0) {
        console.error("Rate calculation error:", {
          selectedRate,
          rateType: formData.rateType,
          hour,
          rateOptions: rateOptions.map(opt => ({ id: opt.id, rate: opt.rate }))
        });
        throw new Error("Invalid rate calculation");
      }


      const preparedEnrollmentData = {
        mentorIdCl: mentor.userIdCl,
        mentorName: mentor.name,
        mentorEmail: mentor.email,
        mentorMobile: mentor.mobile,
        mentorwhatsapp: mentor.whatsapp,
        mentorProfileImage: mentor.profileImage,
        clientIdCl: userDetailData?.userIdCl,
        clientName: formData.fullName,
        clientEmail: formData.email,
        clientDetails: {
          ...(userDetailData
            ? {
                gender: userDetailData.userGender,
                birthDate: userDetailData.userBirthDate,
                height: userDetailData.userHeight,
                weight: latestWeight?.userWeights,
                goals: userDetailData.helpYou,
                activityLevel: userDetailData.activityLevel,
              }
            : {}),
        },
        package: {
          type: formData.rateType,
          rate: selectedRate,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          biography: formData.biography,
          availability: formData.availability,
          trainingLocations: selectedLocations,
          profileImage: imageUrl,
        },
        enrolledAt: new Date().toISOString(),
        status: 'pending', 
      };

      setEnrollmentData(preparedEnrollmentData);
      setPaymentAmount(Number(selectedRate)); // Ensure it's a number
      setCurrentStep(2);
      toast.dismiss(loadingToast);
      toast.success("Ready for payment!");
      return true;
    } catch (error) {
      console.error("Enrollment preparation error:", error);
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to prepare enrollment. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    if (!enrollmentData) {
      toast.error("Enrollment data not found");
      return;
    }

    const loadingToast = toast.loading("Completing enrollment...");

    try {
      // Add payment information to enrollment data
      const finalEnrollmentData = {
        ...enrollmentData,
        paymentDetails: {
          razorpayPaymentId: paymentData.razorpay_payment_id,
          razorpayOrderId: paymentData.razorpay_order_id,
          amount: paymentAmount,
          currency: "INR",
          status: "completed",
          paidAt: new Date().toISOString(),
        },
        status: 'paid_pending', // Status indicating payment is done, waiting for mentor approval
      };

      await addDoc(collection(db, "enrollments"), finalEnrollmentData);

      // Send push notifications to mentor and admin with different messages
      try {
        const adminEmails = ["sushiluidev@gmail.com"];
        const mentorEmail = mentor.email;
        
        await sendEnrollmentNotifications(
          adminEmails,
          mentorEmail,
          formData.fullName,
          mentor.name,
          paymentAmount
        );
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
        // Don't block the enrollment process if notifications fail
      }

      toast.dismiss(loadingToast);
      toast.success("Enrollment and payment completed successfully!");
      router.push("/");

    } catch (error) {
      console.error("Enrollment completion error:", error);
      toast.dismiss(loadingToast);
      toast.error("Payment successful but enrollment failed. Please contact support.");
    }
  };

  const handlePaymentFailure = (error) => {
    console.error("Payment failed:", error);
    toast.error("Payment failed. Please try again.");
    setCurrentStep(1); // Go back to form
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await prepareEnrollmentData();
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Gym Instructor Enrollment</h1>

      {/* Step indicator */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <span className="ml-2">Details</span>
          </div>
          <div className="w-12 h-1 bg-gray-300"></div>
          <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              2
            </div>
            <span className="ml-2">Payment</span>
          </div>
        </div>
      </div>

      {currentStep === 1 ? (
        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mt-4">
          <label className="text-[#8a8a8a] mb-1 block">
            Upload your Recent Photo for Analysis *
          </label>
          <FileUpload
            handleFileUpload={handleProfileUpload}
            fileData={profileData}
            handleFileDelete={handleProfileDelete}
            allowedTypes={["image/jpeg", "image/png"]}
            maxSizeInMB={1}
            totalSizeInMB={profileSize}
            multiple={false}
            required={true}
          />
          {profileData?.base64Data && (
            <div className="mt-2">
              <img
                src={profileData.base64Data}
                alt="Profile Preview"
                className="object-cover w-24 h-24 rounded-full"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <InputBlk
            title="Full Name"
            name="fullName"
            placeholder="Enter Your Full Name"
            value={formData.fullName}
            onChange={handleInputChange}
            required
          />

          <InputBlk
            title="Email"
            name="email"
            type="email"
            value={formData.email}
            disabled
          />

          <InputBlk
            title="Mobile Number"
            name="phoneNumber"
            placeholder="+91 9000012345"
            type="number"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Availability Section */}
        <div>
          <h2 className="mb-3 text-lg font-medium">Availability *</h2>
          <div className="flex flex-wrap gap-3 space-y-2">
            {availableDays.map((day) => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 mr-3 text-blue-500 border-gray-300 rounded accent-black"
                  checked={formData.availability.days.includes(day)}
                  onChange={(e) => {
                    const updatedDays = e.target.checked
                      ? [...formData.availability.days, day]
                      : formData.availability.days.filter((d) => d !== day);
                    setFormData((prev) => ({
                      ...prev,
                      availability: { ...prev.availability, days: updatedDays },
                    }));
                  }}
                />
                {day}
              </label>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {timeSlots.map((slot) => (
              <label key={slot} className="flex items-center">
                <input
                  type="radio"
                  name="timeSlot"
                  className="w-5 h-5 mr-3 text-blue-500 border-gray-300 rounded accent-black"
                  checked={formData.availability.timeSlot === slot}
                  onChange={() => {
                    setFormData((prev) => ({
                      ...prev,
                      availability: { ...prev.availability, timeSlot: slot },
                    }));
                  }}
                />
                {slot}
              </label>
            ))}
          </div>
        </div>

        {/* Rate Options */}
        <div>
          <h2 className="mb-3 text-lg font-medium">Rate and Plans *</h2>
          <div className="space-y-2">
          {rateOptions.map((option) => (
            <label key={option.id} className="flex items-center">
              <input
                type="radio"
                name="rateType"
                className="w-5 h-5 mr-3 text-blue-500 accent-black"
                checked={formData.rateType === option.id}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, rateType: option.id }))
                }
              />
              <span>
                {option.label} - {`₹ ${option.rate}`}
              </span>
            </label>
          ))}
        </div>
        {formData.rateType === "hourly" && (
          <div className="mt-4">
            <InputBlk
              title="Enter Hour in Minutes"
              name="hour"
              type="number"
              placeholder="Enter hour in minutes"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              required
            />
          </div>
        )}
        </div>

        {/* Biography */}
        <TextBlk
          title="Your Lifestyle & Fitness Goals *"
          name="biography"
          placeholder="Describe your routine and goals"
          value={formData.biography}
          onChange={handleInputChange}
          required
        />

        {/* Training Locations */}
        <div>
          <h5 className="mb-3 text-lg font-medium">
            Select Training Location *
          </h5>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            {mentor.trainingLocations.map((loc) => (
              <div
                key={loc.value}
                className={`px-3 py-2 border rounded-lg cursor-pointer transition-all text-sm ${
                  selectedLocations === loc.value
                    ? "bg-gray-500 text-white"
                    : "text-gray-300"
                }`}
                onClick={() => setSelectedLocations(loc.value)}
              >
                <p className="text-center">{loc.label}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-white transition-colors bg-black rounded-lg hover:bg-gray-900 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {loading ? "Preparing..." : "Proceed to Payment"}
        </button>
      </form>
      ) : (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Payment Details</h2>
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Mentor:</span>
                <span className="font-medium">{mentor.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-medium">
                  {rateOptions.find(opt => opt.id === formData.rateType)?.label || 'Custom Hourly'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium text-green-600">₹{paymentAmount}</span>
              </div>
            </div>
          </div>
          
          <SecurePaymentComponent
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
            transactionId={`enrollment_${userDetailData?.userIdCl}_${Date.now()}`}
            amount={paymentAmount}
            description={`Enrollment with ${mentor.name}`}
            buttonText={`Pay ₹${paymentAmount}`}
            buttonClassName="w-full py-3 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          />
          
          <button
            onClick={() => setCurrentStep(1)}
            className="w-full py-3 text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Back to Form
          </button>
        </div>
      )}
    </div>
  );
};

export default EnrollmentForm;
