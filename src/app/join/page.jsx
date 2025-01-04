"use client";
import React, { useState } from "react";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import ButtonCs from "@/components/Button/ButtonCs";
import InputBlk from "@/components/InputCs/InputBlk";
import { Col, Row } from "react-bootstrap";
import CountrySelect from "@/components/Card/CountrySelect";
import Creatable from 'react-select/creatable';
import Select from 'react-select';
import FileUpload from "@/components/FileUpload";
import { useFileUpload } from "@/hooks/useFileUpload";

const MentorRegistration = () => {
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
    name: '',
    email: '',
    mobile: '',
    whatsapp: '',
    alternateNumber: '',
    postal_code: '',
    experience_years: '',
    emergency_contact_relationship: '',
    adhar_card_number: '',
    hourly_rate: '',
    monthly_rate: '',
    quarterly_rate: '',
    half_yearly_rate: '',
    yearly_rate: '',
    certification_file: null
  });
  
  const { handleFileUpload, handleFileDelete, fileData, totalSizeInMB } = useFileUpload(
    ["application/pdf", "image/jpeg", "image/png"],
    5, 
    { single: false, multiple: true,append: true }
  );
  const [errors, setErrors] = useState({
    qualifications: '',
    specializations: '',
    languages: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreatableChange = (value, field) => {
    if (value && value.length > 10) {
      setErrors({
        ...errors,
        [field]: 'Maximum 10 selections allowed'
      });
      return;
    }
    setErrors({
      ...errors,
      [field]: ''
    });
    setFormData({...formData, [field]: value});
  };

  const qualificationOptions = [
    { value: 'Certified Personal Trainer', label: 'Certified Personal Trainer' },
    { value: 'Nutritionist', label: 'Nutritionist' },
    { value: 'Fitness Coach', label: 'Fitness Coach' }
  ];

  const specializationOptions = [
    { value: 'Weight Training', label: 'Weight Training' },
    { value: 'Cardio', label: 'Cardio' },
    { value: 'Yoga', label: 'Yoga' },
    { value: 'Nutrition Planning', label: 'Nutrition Planning' }
  ];

  const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' }
  ];

  const trainingLocationOptions = [
    { value: 'Gym', label: 'Gym' },
    { value: 'Home', label: 'Home' },
    { value: 'Online', label: 'Online' }
  ];

  const daysOptions = [
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' },
    { value: 'Sunday', label: 'Sunday' }
  ];

  const hoursOptions = [
    { value: 'Morning', label: 'Morning' },
    { value: 'Afternoon', label: 'Afternoon' },
    { value: 'Evening', label: 'Evening' }
  ];
  const booleanOptions = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' }
  ];

  const handleSelectChange = (value, field) => {
    setFormData({ ...formData, [field]: value });
  };

  const selectStyles = {
    control: (styles) => ({
      ...styles,
      backgroundColor: '#2a2929',
      borderColor: 'transparent',
      '&:hover': {
        borderColor: 'transparent',
      },
    }),
    input: (styles) => ({
      ...styles,
      color: 'white',
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: '#2a2929',
    }),
    option: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: isFocused ? '#3a3939' : '#2a2929',
      color: 'white',
      '&:hover': {
        backgroundColor: '#3a3939',
      },
    }),
    singleValue: (styles) => ({
      ...styles,
      color: 'white',
    }),
    multiValue: (styles) => ({
      ...styles,
      backgroundColor: '#3a3939',
    }),
    multiValueLabel: (styles) => ({
      ...styles,
      color: 'white',
    }),
    multiValueRemove: (styles) => ({
      ...styles,
      color: 'white',
      '&:hover': {
        backgroundColor: '#4a4949',
        color: 'white',
      },
    }),
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    // Add your form submission logic here
  };
  console.log('Form Data:', fileData);

  return (
    <SecureComponent>
      <div className="flex flex-col h-screen text-white bg-tprimary">
        <div className="top-0 p-3 sticky-top">
          <p className="text-xl">Join as Mentor</p>
        </div>
        <div className="flex-1 p-3 overflow-auto">
          <form onSubmit={handleSubmit}>
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
              <label htmlFor="" className="text-[#8a8a8a] mb-1 whitespace-nowrap">
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
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <br/>
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
                <br/>
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
                <br/>
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
                <label className="text-[#8a8a8a] mb-1 block">Availability</label>
                <Select
                  options={booleanOptions}
                  className="basic-single"
                  value={formData.availability}
                  onChange={(value) => handleSelectChange(value, 'availability')}
                  styles={selectStyles}
                  required
                />
              </Col>
              <Col xs={6}>
                <label className="text-[#8a8a8a] mb-1 block">Certification</label>
                <Select
                  options={booleanOptions}
                  className="text-white basic-single"
                  value={formData.certification}
                  onChange={(value) => handleSelectChange(value, 'certification')}
                  styles={selectStyles}
                  required
                />
              </Col>
              
              <Col xs={6}>
              <br/>
                <label className="text-[#8a8a8a] mb-1 block">Nutrition Consultation</label>
                <Select
                  options={booleanOptions}
                  className="basic-single"
                  value={formData.nutrition_consultation}
                  onChange={(value) => handleSelectChange(value, 'nutrition_consultation')}
                  styles={selectStyles}
                  required
                />
              </Col>
              <Col xs={6}>
              <br/>
                <label className="text-[#8a8a8a] mb-1 block">Meal Planning</label>
                <Select
                  options={booleanOptions}
                  className="basic-single"
                  value={formData.meal_planning}
                  onChange={(value) => handleSelectChange(value, 'meal_planning')}
                  styles={selectStyles}
                  required
                />
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">Qualifications (Max 10)</label>
                <Creatable
                  isMulti
                  options={qualificationOptions}
                  className="basic-multi-select"
                  value={formData.qualifications}
                  onChange={(value) => handleCreatableChange(value, 'qualifications')}
                  styles={selectStyles}
                  maxMenuHeight={200}
                  required
                />
                {errors.qualifications && (
                  <div className="mt-1 text-sm text-red-500">{errors.qualifications}</div>
                )}
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">Specializations (Max 10)</label>
                <Creatable
                  isMulti
                  options={specializationOptions}
                  className="basic-multi-select"
                  value={formData.specializations}
                  onChange={(value) => handleCreatableChange(value, 'specializations')}
                  styles={selectStyles}
                  maxMenuHeight={200}
                  required
                />
                {errors.specializations && (
                  <div className="mt-1 text-sm text-red-500">{errors.specializations}</div>
                )}
              </Col>
            </Row>
            <br />
            <Row>
  <Col xs={12}>
    <label className="text-[#8a8a8a] mb-1 block">Upload Certifications</label>
    <FileUpload
        handleFileUpload={handleFileUpload}
        fileData={fileData}
        handleFileDelete={handleFileDelete}
        allowedTypes={["application/pdf", "image/jpeg", "image/png"]}
        maxSizeInMB={5}
        totalSizeInMB={totalSizeInMB}
      />
<br/>
  </Col>
</Row>

            <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">Languages Spoken (Max 10)</label>
                <Creatable
                  isMulti
                  options={languageOptions}
                  className="basic-multi-select"
                  value={formData.languages}
                  onChange={(value) => handleCreatableChange(value, 'languages')}
                  styles={selectStyles}
                  maxMenuHeight={200}
                  required
                />
                {errors.languages && (
                  <div className="mt-1 text-sm text-red-500">{errors.languages}</div>
                )}
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">Training Locations</label>
                <Select
                  isMulti
                  options={trainingLocationOptions}
                  className="basic-multi-select"
                  value={formData.trainingLocations}
                  onChange={(value) => setFormData({...formData, trainingLocations: value})}
                  styles={selectStyles}
                  maxMenuHeight={200}
                  required
                />
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">Availability Days</label>
                <Select
                  isMulti
                  options={daysOptions}
                  className="basic-multi-select"
                  value={formData.availabilityDays}
                  onChange={(value) => setFormData({...formData, availabilityDays: value})}
                  styles={selectStyles}
                  maxMenuHeight={200}
                  required
                />
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <label className="text-[#8a8a8a] mb-1 block">Availability Hours</label>
                <Select
                  isMulti
                  options={hoursOptions}
                  className="basic-multi-select"
                  value={formData.availabilityHours}
                  onChange={(value) => setFormData({...formData, availabilityHours: value})}
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
                  type="number"
                />
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={12}>
                <InputBlk 
                  title="Aadhar Card Number" 
                  name="adhar_card_number" 
                  placeholder="Enter Aadhar card number"
                  type="number"
                  value={formData.adhar_card_number}
                  onChange={handleInputChange}
                  required
                />
              </Col>
            </Row>
            <br />

            <Row>
              <Col xs={6} >
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
              <Col xs={6} >
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
              <br/>
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
      <h3 className="text-lg font-semibold text-red-500">Important Information</h3>
      <p className="mt-2 text-sm">
        Please make sure that all the details you have provided, such as 
        <strong> specializations</strong>, <strong>qualifications</strong>, 
        and <strong>certifications</strong>, are accurate and up-to-date. 
        We will verify this information before approving your profile.
      </p>
      <p className="mt-2 text-sm">
        By submitting this form, you agree that the information provided is 
        true to the best of your knowledge and consent to being contacted for 
        approval and verification purposes.
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
                <br/>
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