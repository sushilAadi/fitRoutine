import React, { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { GlobalContext } from "@/context/GloablContext";
import InputBlk from "../InputCs/InputBlk";
import TextBlk from "../InputCs/TextArea";
import FileUpload from "../FileUpload";
import { useFileUpload } from "@/hooks/useFileUpload";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import toast from "react-hot-toast";

const EnrollmentForm = ({ mentor, rateOptions, timeSlots, availableDays }) => {
  const router = useRouter();
  const { user, userDetailData } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [hour, setHour] = useState("");

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
  console.log("mentor",mentor);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const loadingToast = toast.loading("Processing your enrollment...");

    try {
      const fileName = `profile-${Date.now()}`;
      const imageUrl = await uploadImageToCloudinary(
        profileData.base64Data,
        fileName
      );

      if (!imageUrl) {
        throw new Error("Failed to upload image");
      }

      // Modify the rate calculation based on whether it's hourly or not
      const selectedRate = formData.rateType === "hourly" 
        ? hour 
        : rateOptions.find((opt) => opt.id === formData.rateType)?.rate;

        const enrollmentData = {
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
                  weight: userDetailData.userWeight,
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
        

      await addDoc(collection(db, "enrollments"), enrollmentData);

      toast.dismiss(loadingToast);
      toast.success("Successfully enrolled with the coach!");
      router.push("/");

      // Reset form
      setFormData({
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
      setHour("");
      setSelectedLocations([]);
      handleProfileDelete();
    } catch (error) {
      console.error("Enrollment error:", error);
      toast.dismiss(loadingToast);
      toast.error(
        error.message || "Failed to complete enrollment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Gym Instructor Enrollment</h1>

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
          title="About You *"
          name="biography"
          placeholder="Enter about yourself"
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
          {loading ? "Submitting..." : "Submit Enrollment"}
        </button>
      </form>
    </div>
  );
};

export default EnrollmentForm;
