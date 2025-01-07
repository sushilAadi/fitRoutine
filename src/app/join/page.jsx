"use client";
import React, { useContext, useState } from "react";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import ButtonCs from "@/components/Button/ButtonCs";
import InputBlk from "@/components/InputCs/InputBlk";
import { Col, Row } from "react-bootstrap";
import CountrySelect from "@/components/Card/CountrySelect";
import Creatable from "react-select/creatable";
import Select from "react-select";
import FileUpload from "@/components/FileUpload";
import { useFileUpload } from "@/hooks/useFileUpload";
import { v4 as uuidv4 } from 'uuid';
import {  collection, addDoc } from "firebase/firestore";

import { Cloudinary } from "@cloudinary/url-gen";
import toast from "react-hot-toast";
import { db } from "@/firebase/firebaseConfig";
import { GlobalContext } from "@/context/GloablContext";

const MentorRegistration = () => {
  
  const {userId,handleOpenClose,user} = useContext(GlobalContext);

 console.log("user",user)


  const [selectedCountry, setSelectedCountry] = useState(null);
  const [formData, setFormData] = useState({
    availability: null,
    certification: null,
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
    certification_file: null,
    profileImage: null,
  });

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

  console.log("fileData",{fileData,aadharData})

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

  const qualificationOptions = [
    {
      value: "Certified Personal Trainer",
      label: "Certified Personal Trainer",
    },
    { value: "Nutritionist", label: "Nutritionist" },
    { value: "Fitness Coach", label: "Fitness Coach" },
  ];

  const specializationOptions = [
    { value: "Weight Training", label: "Weight Training" },
    { value: "Cardio", label: "Cardio" },
    { value: "Yoga", label: "Yoga" },
    { value: "Nutrition Planning", label: "Nutrition Planning" },
  ];

  const languageOptions = [
    { value: "Hindi", label: "Hindi" },
    { value: "English", label: "English" },
    { value: "Assamese", label: "Assamese" },
    { value: "Bengali", label: "Bengali" },
    { value: "Gujarati", label: "Gujarati" },
    { value: "Kannada", label: "Kannada" },
    { value: "Malayalam", label: "Malayalam" },
    { value: "Marathi", label: "Marathi" },
    { value: "Punjabi", label: "Punjabi" },
    { value: "Tamil", label: "Tamil" },
    { value: "Telugu", label: "Telugu" },
    { value: "Urdu", label: "Urdu" },
    
  ];

  const trainingLocationOptions = [
    { value: "Gym", label: "Gym" },
    { value: "Home", label: "Home" },
    { value: "Online", label: "Online" },
  ];

  const daysOptions = [
    { value: "Monday", label: "Monday" },
    { value: "Tuesday", label: "Tuesday" },
    { value: "Wednesday", label: "Wednesday" },
    { value: "Thursday", label: "Thursday" },
    { value: "Friday", label: "Friday" },
    { value: "Saturday", label: "Saturday" },
    { value: "Sunday", label: "Sunday" },
  ];

  const hoursOptions = [
    { value: "Morning", label: "Morning" },
    { value: "Afternoon", label: "Afternoon" },
    { value: "Evening", label: "Evening" },
  ];
  const booleanOptions = [
    { value: true, label: "Yes" },
    { value: false, label: "No" },
  ];

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
        
        console.log('Starting upload to Cloudinary...'); // Debug log

        const uploadResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            console.error('Cloudinary Error Response:', errorData);
            throw new Error(errorData.error?.message || 'Upload failed');
        }

        const data = await uploadResponse.json();
        console.log('Upload successful:', data); // Debug log
        
        if (data.secure_url) {
            return data.secure_url;
        } else {
            throw new Error("No secure URL in response");
        }
    } catch (error) {
        console.error('Detailed upload error:', error);
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
        const uploadedAadharUrl = await uploadImageToCloudinary(
            aadharData.base64Data,
            `aadhar_${aadharData.fileName}`
        );
        
        const uploadedProfileUrl = await uploadImageToCloudinary(
            profileData.base64Data,
            `profile_${profileData.fileName}`
        );
        
        if (!uploadedAadharUrl || !uploadedProfileUrl) {
            toast.error("Failed to upload documents");
            return;
        }

        const uploadPromises = fileData.map((file, index) => 
            uploadImageToCloudinary(
                file.base64Data,
                `cert_${index}_${file.fileName}`
            )
        );

        const uploadCertificationUrls = await Promise.all(uploadPromises);

        if (uploadCertificationUrls.some(url => !url)) {
            throw new Error("Some certification uploads failed");
        }

        const formDataWithUrls = {
            ...formData,
            aadharImage: uploadedAadharUrl,
            profileImage: uploadedProfileUrl,
            certificationImage: uploadCertificationUrls,
            userIdCl: userId,
            uploadedAt: new Date().toISOString(),
            email: user?.primaryEmailAddress?.emailAddress
        };

        const docRef = await addDoc(collection(db, "Mentor"), formDataWithUrls);
        
        if (docRef.id) {
            toast.success("Successfully registered!");
        } else {
            throw new Error("Firebase document creation failed");
        }

    } catch (error) {
        console.error("Form submission error:", error);
        toast.error(error.message || "Registration failed. Please try again.");
    } finally {
        toast.dismiss(toastId);
    }
};
  console.log("Form Data:", fileData);

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