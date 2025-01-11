"use client";
import React, { useContext, useState, useEffect } from "react";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import ButtonCs from "@/components/Button/ButtonCs";
import InputBlk from "@/components/InputCs/InputBlk";
import { Col, Row } from "react-bootstrap";
import CountrySelect from "@/components/Card/CountrySelect";
import Creatable from "react-select/creatable";
import Select from "react-select";
import FileUpload from "@/components/FileUpload";
import { useFileUpload } from "@/hooks/useFileUpload";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { Cloudinary } from "@cloudinary/url-gen";
import toast from "react-hot-toast";
import { db } from "@/firebase/firebaseConfig";
import { GlobalContext } from "@/context/GloablContext";
import TextBlk from "@/components/InputCs/TextArea";
import { booleanOptions, daysOptions, hoursOptions, languageOptions, qualificationOptions, specializationOptions, trainingLocationOptions } from "@/utils";

const MentorRegistration = () => {
  
  const {userId,handleOpenClose,user} = useContext(GlobalContext);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const userRole = user?.publicMetadata?.role ?? "user";





  const [selectedCountry, setSelectedCountry] = useState(null);
  const [formData, setFormData] = useState({
    availability: null,
    certification: null,
    AboutMe:'',
    nutrition_consultation: null,
    meal_planning: null,
    qualifications: [],
    specializations: [],
    languages: [],
    trainingLocations: [],
    availabilityDays: [],
    availabilityHours: [],
    name: "",
    email: "",
    mobile: "",
    whatsapp: "",
    alternateNumber: "",
    postal_code: "",
    experience_years: "",
    emergency_contact_relationship: "",
    adhar_card_number: "",
    hourly_rate: "",
    monthly_rate: "",
    quarterly_rate: "",
    half_yearly_rate: "",
    yearly_rate: "",
    profileImage: null,
  });


  useEffect(() => {
    const checkExistingRegistration = async () => {
      try {
        const mentorsRef = collection(db, "Mentor");
        const q = query(mentorsRef, where("userIdCl", "==", userId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setIsAlreadyRegistered(true);
          toast.error("You are already registered as a mentor!");
        }
      } catch (error) {
        toast.error("Error checking registration status");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      checkExistingRegistration();
    }
  }, [userId]);

  const { handleFileUpload, handleFileDelete, fileData, totalSizeInMB } =
    useFileUpload(["image/jpeg", "image/png"], 5, {
      single: false,
      multiple: true,
      append: true,
      maxFiles: 3
    });

  const { handleFileUpload:hanmdleAadharUpload, handleFileDelete:handleAadharDelete, fileData:aadharData, totalSizeInMB:aadharSize } =
    useFileUpload(["application/pdf", "image/jpeg", "image/png"], 1, {
      single: true,
      multiple: false,
      append: false,
    });

    const { handleFileUpload: handleProfileUpload, handleFileDelete: handleProfileDelete, fileData: profileData, totalSizeInMB: profileSize } =
    useFileUpload(["image/jpeg", "image/png"], 1, {
      single: true,
      multiple: false,
      append: false,
    });
  const [errors, setErrors] = useState({
    qualifications: "",
    specializations: "",
    languages: "",
  });

  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreatableChange = (value, field) => {
    if (value && value.length > 10) {
      setErrors({
        ...errors,
        [field]: "Maximum 10 selections allowed",
      });
      return;
    }
    setErrors({
      ...errors,
      [field]: "",
    });
    setFormData({ ...formData, [field]: value });
  };

 

  

 

  const handleSelectChange = (value, field) => {
    setFormData({ ...formData, [field]: value });
  };

  const selectStyles = {
    control: (styles) => ({
      ...styles,
      backgroundColor: "#2a2929",
      borderColor: "transparent",
      "&:hover": {
        borderColor: "transparent",
      },
    }),
    input: (styles) => ({
      ...styles,
      color: "white",
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: "#2a2929",
    }),
    option: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: isFocused ? "#3a3939" : "#2a2929",
      color: "white",
      "&:hover": {
        backgroundColor: "#3a3939",
      },
    }),
    singleValue: (styles) => ({
      ...styles,
      color: "white",
    }),
    multiValue: (styles) => ({
      ...styles,
      backgroundColor: "#3a3939",
    }),
    multiValueLabel: (styles) => ({
      ...styles,
      color: "white",
    }),
    multiValueRemove: (styles) => ({
      ...styles,
      color: "white",
      "&:hover": {
        backgroundColor: "#4a4949",
        color: "white",
      },
    }),
  };




  const uploadImageToCloudinary = async (base64Data,  fileName) => {
    if (!base64Data) {
        toast.error("No image data provided");
        return null;
    }
    
    try {
      
        // Check if base64Data is proper
        if (!base64Data.startsWith('data:image/')) {
            throw new Error("Invalid image format");
        }
        

        const formData = new FormData();
        formData.append('file', base64Data);
        formData.append('upload_preset', 'ml_default'); // Replace with your preset name if different
        formData.append('folder', 'mentor-registration');
        formData.append('public_id', `${userId}/${fileName}`);
        
        

        const uploadResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error?.message || 'Upload failed');
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



   const fetchImageFromCloudinary = (publicId) =>{
    const cloud = new Cloudinary({
      cloud: {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      },
    });

    return cloud.image(publicId).toURL()
   }

   const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isAlreadyRegistered) {
      // toast.error("You are already registered as a mentor!");
      return;
    }
  
    if (!aadharData?.base64Data) {
      toast.error("Aadhar is mandatory");
      return;
    }
  
    if (!profileData?.base64Data) {
      toast.error("Profile image is mandatory");
      return;
    }
  
    if (fileData.length === 0 || fileData.length > 3) {
      toast.error("Please upload 1-3 certification documents");
      return;
    }
  
    const toastId = toast.loading("Uploading files...");
    
    try {
      // Double-check registration status before proceeding
      const mentorsRef = collection(db, "Mentor");
      const q = query(mentorsRef, where("userIdCl", "==", userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast.error("You are already registered as a mentor!");
        return;
      }
  
      // Upload Aadhar document
      const uploadedAadharUrl = await uploadImageToCloudinary(
        aadharData.base64Data,
        `aadhar_${userId}`
      );
      if (!uploadedAadharUrl) throw new Error("Aadhar upload failed");
  
      // Upload Profile image
      const uploadedProfileUrl = await uploadImageToCloudinary(
        profileData.base64Data,
        `profile_${userId}`
      );
      if (!uploadedProfileUrl) throw new Error("Profile image upload failed");
  
      // Upload certification files
      const uploadCertificationUrls = await Promise.all(
        fileData.map((file, index) =>
          uploadImageToCloudinary(
            file.base64Data,
            `certification_${userId}_${index}`
          )
        )
      );
      
      if (uploadCertificationUrls.includes(null)) {
        throw new Error("One or more certification uploads failed");
      }
  
      const formDataWithUrls = {
        ...formData,
        aadharImage: uploadedAadharUrl,
        profileImage: uploadedProfileUrl,
        certificationImages: uploadCertificationUrls,
        userIdCl: userId,
        uploadedAt: new Date().toISOString(),
        email: user?.primaryEmailAddress?.emailAddress
      };
  
      const docRef = await addDoc(collection(db, "Mentor"), formDataWithUrls);
      
      if (docRef.id) {
        toast.success("Successfully registered!");
        setIsAlreadyRegistered(true);
      } else {
        throw new Error("Firebase document creation failed");
      }
  
    } catch (error) {
      
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      toast.dismiss(toastId);
    }
  };

  if (isAlreadyRegistered) {
    return (
      <SecureComponent>
        <div className="flex flex-col items-center justify-center h-screen text-white bg-tprimary">
          <h2 className="text-xl font-semibold">Already Registered</h2>
          <p className="mt-4 text-center">
            You have already registered as a mentor. {(userRole !== "admin" && userRole !== "coach") && "Our team will review your application and get back to you soon."} 
          </p>
          <ButtonCs 
            title="Go Back" 
            className="mt-6"
            onClick={handleOpenClose}
          >
            Go Back
          </ButtonCs>
        </div>
      </SecureComponent>
    );
  }
  

  return (
    <SecureComponent>
      <div className="flex flex-col h-screen text-white bg-tprimary">
        <div className="top-0 p-3 sticky-top" onClick={handleOpenClose}>
          <p className="text-xl">Join as Mentor</p>
        </div>
        <div className="flex-1 p-3 overflow-auto">
          <form onSubmit={handleSubmit}>
          <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">
                  Profile Image
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
                <br />
              </Col>
            </Row>
            <InputBlk
              title="Full Name"
              name="name"
              placeholder="Enter Your Full Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <br />
            <TextBlk
              title="About You"
              name="AboutMe"
              placeholder="Enter about yourself"
              value={formData.AboutMe}
              onChange={handleInputChange}
              required
            />
            <br />
            <div className="relative z-10">
              <label
                htmlFor=""
                className="text-[#8a8a8a] mb-1 whitespace-nowrap"
              >
                Country
              </label>
              <CountrySelect
                onChange={setSelectedCountry}
                value={selectedCountry}
              />
            </div>
            <br />

            <Row>
              <Col xs={12}>
                <InputBlk
                  title="Email"
                  name="email"
                  placeholder="Enter Email id"
                  type="email"
                  value={user?.primaryEmailAddress?.emailAddress}
                  onChange={handleInputChange}
                  disabled
                />
                <br />
              </Col>
              <Col xs={6}>
                <InputBlk
                  title="Mobile Number"
                  name="mobile"
                  placeholder="+91 9000012345"
                  type="number"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  required
                />
              </Col>
              <Col xs={6}>
                <InputBlk
                  title="Whatsapp Number"
                  name="whatsapp"
                  placeholder="+91 9000012345"
                  type="number"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  required
                />
              </Col>
              <Col xs={6}>
                <br />
                <InputBlk
                  title="Alternate Number"
                  name="alternateNumber"
                  placeholder="+91 9000012345"
                  value={formData.alternateNumber}
                  onChange={handleInputChange}
                  required
                />
              </Col>
              <Col xs={6}>
                <br />
                <InputBlk
                  title="Postal Code"
                  name="postal_code"
                  placeholder="Enter your postal code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  required
                />
              </Col>
            </Row>
            <br />
            <Row>
              <Col xs={6}>
                <label className="text-[#8a8a8a] mb-1 block">
                  Availability
                </label>
                <Select
                  options={booleanOptions}
                  className="basic-single"
                  value={formData.availability}
                  onChange={(value) =>
                    handleSelectChange(value, "availability")
                  }
                  styles={selectStyles}
                  required
                />
              </Col>
              <Col xs={6}>
                <label className="text-[#8a8a8a] mb-1 block">
                  Certification
                </label>
                <Select
                  options={booleanOptions}
                  className="text-white basic-single"
                  value={formData.certification}
                  onChange={(value) =>
                    handleSelectChange(value, "certification")
                  }
                  styles={selectStyles}
                  required
                />
              </Col>

              <Col xs={6}>
                <br />
                <label className="text-[#8a8a8a] mb-1 block">
                  Nutrition Consultation
                </label>
                <Select
                  options={booleanOptions}
                  className="basic-single"
                  value={formData.nutrition_consultation}
                  onChange={(value) =>
                    handleSelectChange(value, "nutrition_consultation")
                  }
                  styles={selectStyles}
                  required
                />
              </Col>
              <Col xs={6}>
                <br />
                <label className="text-[#8a8a8a] mb-1 block">
                  Meal Planning
                </label>
                <Select
                  options={booleanOptions}
                  className="basic-single"
                  value={formData.meal_planning}
                  onChange={(value) =>
                    handleSelectChange(value, "meal_planning")
                  }
                  styles={selectStyles}
                  required
                />
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">
                  Qualifications (Max 10)
                </label>
                <Creatable
                  isMulti
                  options={qualificationOptions}
                  className="basic-multi-select"
                  value={formData.qualifications}
                  onChange={(value) =>
                    handleCreatableChange(value, "qualifications")
                  }
                  styles={selectStyles}
                  maxMenuHeight={200}
                  required
                />
                {errors.qualifications && (
                  <div className="mt-1 text-sm text-red-500">
                    {errors.qualifications}
                  </div>
                )}
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">
                  Specializations (Max 10)
                </label>
                <Creatable
                  isMulti
                  options={specializationOptions}
                  className="basic-multi-select"
                  value={formData.specializations}
                  onChange={(value) =>
                    handleCreatableChange(value, "specializations")
                  }
                  styles={selectStyles}
                  maxMenuHeight={200}
                  required
                />
                {errors.specializations && (
                  <div className="mt-1 text-sm text-red-500">
                    {errors.specializations}
                  </div>
                )}
              </Col>
            </Row>
            <br />
            <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">
                  Upload Certifications
                </label>
                <FileUpload
                  handleFileUpload={handleFileUpload}
                  fileData={fileData}
                  handleFileDelete={handleFileDelete}
                  allowedTypes={[ "image/jpeg", "image/png"]}
                  maxSizeInMB={5}
                  totalSizeInMB={totalSizeInMB}
                  multiple={true}
                  required={true}
                />
                {fileData.length > 3 && (
                  <div className="mt-1 text-sm text-red-500">
                    Maximum 3 certification files allowed
                  </div>
                )}
                <br />
              </Col>
            </Row>
            <Row>
            <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">
                  Upload Aadhar
                </label>
                <FileUpload
                  handleFileUpload={hanmdleAadharUpload}
                  fileData={aadharData}
                  handleFileDelete={handleAadharDelete}
                  allowedTypes={[ "image/jpeg", "image/png"]}
                  maxSizeInMB={1}
                  totalSizeInMB={aadharSize}
                  multiple={false}
                  required={true}
                />
                <br />
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">
                  Languages Spoken (Max 10)
                </label>
                <Creatable
                  isMulti
                  options={languageOptions}
                  className="basic-multi-select"
                  value={formData.languages}
                  onChange={(value) =>
                    handleCreatableChange(value, "languages")
                  }
                  styles={selectStyles}
                  maxMenuHeight={200}
                  required
                />
                {errors.languages && (
                  <div className="mt-1 text-sm text-red-500">
                    {errors.languages}
                  </div>
                )}
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">
                  Training Locations
                </label>
                <Select
                  isMulti
                  options={trainingLocationOptions}
                  className="basic-multi-select"
                  value={formData.trainingLocations}
                  onChange={(value) =>
                    setFormData({ ...formData, trainingLocations: value })
                  }
                  styles={selectStyles}
                  maxMenuHeight={200}
                  required
                />
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">
                  Availability Days
                </label>
                <Select
                  isMulti
                  options={daysOptions}
                  className="basic-multi-select"
                  value={formData.availabilityDays}
                  onChange={(value) =>
                    setFormData({ ...formData, availabilityDays: value })
                  }
                  styles={selectStyles}
                  maxMenuHeight={200}
                  required
                />
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">
                  Availability Hours
                </label>
                <Select
                  isMulti
                  options={hoursOptions}
                  className="basic-multi-select"
                  value={formData.availabilityHours}
                  onChange={(value) =>
                    setFormData({ ...formData, availabilityHours: value })
                  }
                  styles={selectStyles}
                  maxMenuHeight={200}
                  required
                />
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <InputBlk
                  title="Years of Experience"
                  name="experience_years"
                  placeholder="Enter years of experience"
                  type="number"
                  value={formData.experience_years}
                  onChange={handleInputChange}
                  required
                />
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <InputBlk
                  title="Emergency Contact Relationship"
                  name="emergency_contact_relationship"
                  placeholder="Enter relationship with emergency contact"
                  value={formData.emergency_contact_relationship}
                  onChange={handleInputChange}
                  required
                   type="text"
                />
              </Col>
            </Row>
            <br />

            <br />

            <Row>
              <Col xs={6}>
                <InputBlk
                  title="Hourly Rate (₹)"
                  name="hourly_rate"
                  placeholder="Enter hourly rate"
                  type="number"
                  value={formData.hourly_rate}
                  onChange={handleInputChange}
                  required
                />
              </Col>
              <Col xs={6}>
                <InputBlk
                  title="Monthly Rate (₹)"
                  name="monthly_rate"
                  placeholder="Enter monthly rate"
                  type="number"
                  value={formData.monthly_rate}
                  onChange={handleInputChange}
                  required
                />
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={6}>
                <InputBlk
                  title="Quarterly Rate (₹)"
                  name="quarterly_rate"
                  placeholder="Enter quarterly rate"
                  type="number"
                  value={formData.quarterly_rate}
                  onChange={handleInputChange}
                  required
                />
              </Col>
              <Col xs={6}>
                <InputBlk
                  title="Half Yearly Rate (₹)"
                  name="half_yearly_rate"
                  placeholder="Enter half yearly rate"
                  type="number"
                  value={formData.half_yearly_rate}
                  onChange={handleInputChange}
                  required
                />
              </Col>
              <Col xs={12} md={4}>
                <br />
                <InputBlk
                  title="Yearly Rate (₹)"
                  name="yearly_rate"
                  placeholder="Enter yearly rate"
                  type="number"
                  value={formData.yearly_rate}
                  onChange={handleInputChange}
                  required
                />
              </Col>
            </Row>
            <br />

            <div className="bg-[#3a3939] text-white p-4 rounded-md">
              <h3 className="text-lg font-semibold text-red-500">
                Important Information
              </h3>
              <p className="mt-2 text-sm">
                Please make sure that all the details you have provided, such as
                <strong> specializations</strong>,{" "}
                <strong>qualifications</strong>, and{" "}
                <strong>certifications</strong>, are accurate and up-to-date. We
                will verify this information before approving your profile.
              </p>
              <p className="mt-2 text-sm">
                By submitting this form, you agree that the information provided
                is true to the best of your knowledge and consent to being
                contacted for approval and verification purposes.
              </p>
              <div className="mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    required
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 accent-black"
                  />
                  <span className="text-sm">
                    I agree to the terms and conditions stated above.
                  </span>
                </label>
              </div>
            </div>
            <br />
            <ButtonCs title="Submit" type="submit" className="w-full">
              Register as Mentor
            </ButtonCs>
          </form>
        </div>
      </div>
    </SecureComponent>
  );
};

export default MentorRegistration;