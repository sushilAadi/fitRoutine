"use client";
import React, { useEffect, useState, useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import { Row, Col, Badge, Table, Button } from "react-bootstrap";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import EnrollmentOffCanvas from "@/components/admin/EnrollmentOffCanvas";
import "./InstructorManagement.css";

const InstructorManagement = () => {
  const { user } = useContext(GlobalContext);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredAndSortedInstructors, setFilteredAndSortedInstructors] = useState([]);
  const [enrollmentStats, setEnrollmentStats] = useState({});
  const [showEnrollmentOffCanvas, setShowEnrollmentOffCanvas] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  const userRole = user?.publicMetadata?.role;

  // Utility function to safely get array length
  const safeLength = (arr) => {
    return Array.isArray(arr) ? arr.length : 0;
  };

  // Utility function to safely render any value
  const safeRender = (value, fallback = 'N/A') => {
    try {
      // Handle null/undefined
      if (value === null || value === undefined) {
        return fallback;
      }
      
      // Handle primitives
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      
      // Handle objects
      if (typeof value === 'object') {
        // Try common label properties
        if (value.label !== undefined) {
          return String(value.label);
        }
        if (value.name !== undefined) {
          return String(value.name);
        }
        if (value.title !== undefined) {
          return String(value.title);
        }
        if (value.subtitle !== undefined) {
          return String(value.subtitle);
        }
        if (value.factor !== undefined) {
          return String(value.factor);
        }
        
        // Convert object to string representation
        return JSON.stringify(value);
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        return value.map(item => safeRender(item)).join(', ');
      }
      
      // Fallback for any other type
      return String(value);
    } catch (error) {
      console.error('Error in safeRender:', error, 'Value:', value);
      return fallback;
    }
  };

  // Debug function to scan for objects in instructor data
  const scanForObjects = (data, path = '') => {
    if (typeof data === 'object' && data !== null) {
      Object.keys(data).forEach(key => {
        const value = data[key];
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if (value.hasOwnProperty('subtitle') && value.hasOwnProperty('id') && value.hasOwnProperty('factor')) {
            console.error(`Found problematic object at ${currentPath}:`, value);
          }
        }
        
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            scanForObjects(item, `${currentPath}[${index}]`);
          });
        } else if (typeof value === 'object' && value !== null) {
          scanForObjects(value, currentPath);
        }
      });
    }
  };

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      
      // Fetch instructors and enrollment stats in parallel
      const [instructorsResponse, enrollmentStatsResponse] = await Promise.all([
        fetch('/api/admin/instructors'),
        fetch('/api/admin/enrollments/stats')
      ]);
      
      if (!instructorsResponse.ok) {
        throw new Error('Failed to fetch instructors');
      }
      
      const instructorsData = await instructorsResponse.json();
      const instructors = instructorsData.instructors || [];
      
      // Debug scan for problematic objects
      console.log('Scanning instructor data for objects...');
      instructors.forEach((instructor, index) => {
        scanForObjects(instructor, `instructors[${index}]`);
      });
      
      setInstructors(instructors);
      
      // Process enrollment stats if available
      if (enrollmentStatsResponse.ok) {
        const enrollmentData = await enrollmentStatsResponse.json();
        const statsMap = {};
        
        enrollmentData.mentorStats?.forEach(stat => {
          statsMap[stat.mentorId] = stat;
        });
        
        setEnrollmentStats(statsMap);
      }
    } catch (error) {
      console.error("Error fetching instructors:", error);
      toast.error("Failed to load instructors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "admin" || userRole === "coach") {
      fetchInstructors();
    }
  }, [userRole]);

  const handleApproveInstructor = async (instructorId) => {
    try {
      // Optimistically update the instructor status
      setInstructors(prevInstructors => 
        prevInstructors.map(instructor => 
          instructor.id === instructorId 
            ? { 
                ...instructor, 
                status: 'approved',
                approvedAt: new Date().toISOString()
              }
            : instructor
        )
      );

      const response = await fetch(`/api/admin/instructors/${instructorId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setInstructors(prevInstructors => 
          prevInstructors.map(instructor => 
            instructor.id === instructorId 
              ? { 
                  ...instructor, 
                  status: 'pending',
                  approvedAt: null
                }
              : instructor
          )
        );
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve instructor');
      }

      const data = await response.json();
      toast.success("Instructor approved successfully! Role updated to coach.");
    } catch (error) {
      console.error("Error approving instructor:", error);
      toast.error("Failed to approve instructor: " + error.message);
    }
  };

  const handleRejectInstructor = async (instructorId) => {
    try {
      // Optimistically update the instructor status
      setInstructors(prevInstructors => 
        prevInstructors.map(instructor => 
          instructor.id === instructorId 
            ? { 
                ...instructor, 
                status: 'rejected',
                rejectedAt: new Date().toISOString()
              }
            : instructor
        )
      );

      const response = await fetch(`/api/admin/instructors/${instructorId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setInstructors(prevInstructors => 
          prevInstructors.map(instructor => 
            instructor.id === instructorId 
              ? { 
                  ...instructor, 
                  status: 'pending',
                  rejectedAt: null
                }
              : instructor
          )
        );
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject instructor');
      }

      const data = await response.json();
      toast.success("Instructor rejected");
    } catch (error) {
      console.error("Error rejecting instructor:", error);
      toast.error("Failed to reject instructor: " + error.message);
    }
  };

  const handleDeleteInstructor = async (instructorId) => {
    if (!confirm("Are you sure you want to delete this instructor? This action cannot be undone.")) {
      return;
    }

    try {
      // Store the instructor data for potential restoration
      const instructorToDelete = instructors.find(instructor => instructor.id === instructorId);
      
      // Optimistically remove the instructor from the list
      setInstructors(prevInstructors => 
        prevInstructors.filter(instructor => instructor.id !== instructorId)
      );

      const response = await fetch(`/api/admin/instructors/${instructorId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Restore the instructor on error
        if (instructorToDelete) {
          setInstructors(prevInstructors => [...prevInstructors, instructorToDelete]);
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete instructor');
      }

      const data = await response.json();
      toast.success("Instructor deleted successfully");
    } catch (error) {
      console.error("Error deleting instructor:", error);
      toast.error("Failed to delete instructor: " + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "warning",
      approved: "success", 
      rejected: "danger"
    };
    
    return (
      <Badge bg={statusColors[status] || "secondary"} className="text-capitalize">
        {status || "pending"}
      </Badge>
    );
  };

  const toggleRowExpansion = (instructorId) => {
    setExpandedRow(expandedRow === instructorId ? null : instructorId);
  };

  const handleViewEnrollments = (instructor) => {
    setSelectedInstructor(instructor);
    setShowEnrollmentOffCanvas(true);
  };

  const filterAndSortInstructors = () => {
    let filtered = instructors.filter(instructor => {
      // Text search filter
      const instructorName = safeRender(instructor.name, '');
      const matchesSearch = instructorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           instructor.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "pending" && (!instructor.status || instructor.status === "pending")) ||
                           instructor.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch(sortBy) {
        case "experience":
          aValue = parseInt(a.experience_years) || 0;
          bValue = parseInt(b.experience_years) || 0;
          break;
        case "name":
          aValue = safeRender(a.name, '').toLowerCase();
          bValue = safeRender(b.name, '').toLowerCase();
          break;
        case "email":
          aValue = a.email?.toLowerCase() || "";
          bValue = b.email?.toLowerCase() || "";
          break;
        case "status":
          aValue = a.status?.toLowerCase() || "pending";
          bValue = b.status?.toLowerCase() || "pending";
          break;
        default:
          aValue = safeRender(a.name, '').toLowerCase();
          bValue = safeRender(b.name, '').toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAndSortedInstructors(filtered);
  };

  useEffect(() => {
    filterAndSortInstructors();
  }, [instructors, searchTerm, sortBy, sortOrder, statusFilter]);

  return (
    <div className="instructor-management">
      {/* Header */}
      <div className="p-4 mb-4 bg-white shadow-sm border-bottom">
        <div>
          <h1 className="mb-2 h2 text-dark fw-bold">Instructor Management</h1>
          <p className="mb-0 text-muted">Manage instructor applications and approvals</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 container-fluid content-container">
        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading instructors...</p>
          </div>
        ) : safeLength(filteredAndSortedInstructors) > 0 ? (
          <>
            {/* Search and Filter Controls */}
            <div className="mb-3 row align-items-end">
              <div className="col-md-6">
                <div className="gap-3 d-flex align-items-center">
                  <span className="text-muted">Total: {safeLength(instructors)} | </span>
                  <span className="text-warning">Pending: {safeLength(Array.isArray(instructors) ? instructors.filter(i => i.status === "pending" || !i.status) : [])} | </span>
                  <span className="text-success">Approved: {safeLength(Array.isArray(instructors) ? instructors.filter(i => i.status === "approved") : [])} | </span>
                  <span className="text-danger">Rejected: {safeLength(Array.isArray(instructors) ? instructors.filter(i => i.status === "rejected") : [])}</span>
                </div>
              </div>
              <div className="col-md-6">
                <div className="row">
                  <div className="col-md-7">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="col-md-5">
                    <select 
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded shadow table-container">
              {/* Fixed Header */}
              <div className="table-header">
                <Table className="mb-0" style={{marginBottom: '0 !important'}}>
                  <thead className="text-white bg-primary">
                    <tr>
                      <th style={{width: '80px'}}>Profile</th>
                      <th style={{width: '150px'}}>Name</th>
                      <th style={{width: '200px'}}>Email</th>
                      <th style={{width: '120px', cursor: 'pointer'}} onClick={() => {
                        if (sortBy === "experience") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("experience");
                          setSortOrder("asc");
                        }
                      }}>
                        Experience 
                        {sortBy === "experience" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                        {sortBy !== "experience" && <span style={{opacity: 0.5}}>⚬</span>}
                      </th>
                      <th style={{width: '100px'}}>Status</th>
                      <th style={{width: '120px'}}>Enrollments</th>
                      <th style={{width: '120px'}}>Applied Date</th>
                      <th style={{width: '200px'}}>Actions</th>
                    </tr>
                  </thead>
                </Table>
              </div>
              
              {/* Scrollable Body */}
              <div className="table-body-container">
                <Table striped bordered hover className="mb-0 instructor-table">
                  <tbody>
                    {filteredAndSortedInstructors.map((instructor) => (
                      <React.Fragment key={instructor.id}>
                        <tr className="instructor-row">
                          <td style={{width: '80px'}}>
                            {instructor.profileImage && (
                              <img
                                src={instructor.profileImage}
                                alt="Profile"
                                className="object-cover rounded-circle w-[50px] h-[50px]"
                                width="50"
                                height="50"
                              />
                            )}
                          </td>
                          <td style={{width: '150px'}}>
                            <strong>{safeRender(instructor.name, 'Unknown')}</strong>
                          </td>
                          <td style={{width: '200px'}}>{safeRender(instructor.email)}</td>
                          <td style={{width: '120px'}}>{safeRender(instructor.experience_years)} years</td>
                          <td style={{width: '100px'}}>
                            {getStatusBadge(instructor.status)}
                          </td>
                          <td style={{width: '120px'}}>
                            <div className="text-center">
                              <div className="fw-bold text-primary">
                                {enrollmentStats[instructor.userIdCl]?.total || 0}
                                {enrollmentStats[instructor.userIdCl]?.pending > 0 && (
                                  <span className="text-warning ms-1">
                                    ({enrollmentStats[instructor.userIdCl].pending} pending)
                                  </span>
                                )}
                              </div>
                              {enrollmentStats[instructor.userIdCl]?.latestEnrollment && (
                                <small className="text-muted d-block">
                                  Last: {new Date(enrollmentStats[instructor.userIdCl].latestEnrollment).toLocaleDateString()}
                                </small>
                              )}
                            </div>
                          </td>
                          <td style={{width: '120px'}}>
                            {new Date(instructor.uploadedAt).toLocaleDateString()}
                          </td>
                          <td style={{width: '200px'}}>
                            <div className="flex-wrap gap-1 d-flex">
                              <Button
                                variant={expandedRow === instructor.id ? "primary" : "outline-primary"}
                                size="sm"
                                onClick={() => toggleRowExpansion(instructor.id)}
                              >
                                {expandedRow === instructor.id ? "Hide" : "View"}
                              </Button>
                              {instructor.status === "pending" || !instructor.status ? (
                                <>
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleApproveInstructor(instructor.id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleRejectInstructor(instructor.id)}
                                  >
                                    Reject
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDeleteInstructor(instructor.id)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {expandedRow === instructor.id && (
                            <motion.tr
                              key={`expanded-${instructor.id}`}
                              className="expandable-row"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{
                                duration: 0.4,
                                ease: [0.25, 0.46, 0.45, 0.94]
                              }}
                            >
                              <td colSpan="8" style={{ padding: 0, border: 'none' }}>
                                <motion.div
                                  className="expandable-content bg-light"
                                  initial={{ y: -20, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  exit={{ y: -20, opacity: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    delay: 0.1
                                  }}
                                  style={{ padding: '1.5rem' }}
                                >
                                  {/* Main Info Section */}
                                  <Row className="mb-4">
                                    <Col md={3}>
                                      {instructor.profileImage && (
                                        <img
                                          src={instructor.profileImage}
                                          alt="Profile"
                                          className="mb-3 rounded-lg profile-image"
                                        />
                                      )}
                                      {instructor.aadharImage && (
                                        <div>
                                          <h6 className="mb-2">Aadhar Document</h6>
                                          <img
                                            src={instructor.aadharImage}
                                            alt="Aadhar"
                                            className="rounded document-image"
                                          />
                                        </div>
                                      )}
                                    </Col>
                                    
                                    <Col md={3}>
                                      <h5 className="mb-3">{safeRender(instructor.name, 'Unknown Instructor')}</h5>
                                      <div className="mb-2"><strong>Contact Info:</strong></div>
                                      <p className="mb-1 small">📧 {safeRender(instructor.email)}</p>
                                      <p className="mb-1 small">📱 {safeRender(instructor.mobile)}</p>
                                      <p className="mb-1 small">💬 {safeRender(instructor.whatsapp)}</p>
                                      {instructor.alternateNumber && (
                                        <p className="mb-1 small">📞 Alt: {safeRender(instructor.alternateNumber)}</p>
                                      )}
                                      <p className="mb-1 small">📮 Postal: {safeRender(instructor.postal_code)}</p>
                                      <p className="mb-1 small">🏢 Experience: {safeRender(instructor.experience_years)} years</p>
                                      <div className="mt-2">
                                        <strong>Status:</strong> {getStatusBadge(instructor.status)}
                                      </div>
                                    </Col>
                                    
                                    <Col md={3}>
                                      <div className="mb-3">
                                        <h6>About</h6>
                                        <p className="text-muted small">{safeRender(instructor.AboutMe)}</p>
                                      </div>
                                      
                                      <div className="mb-3">
                                        <h6>Qualifications</h6>
                                        <div className="flex-wrap gap-1 d-flex">
                                          {instructor.qualifications?.map((qual, index) => (
                                            <Badge key={index} bg="secondary" className="small">
                                              {safeRender(qual, 'Unknown')}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      <div className="mb-3">
                                        <h6>Specializations</h6>
                                        <div className="flex-wrap gap-1 d-flex">
                                          {instructor.specializations?.map((spec, index) => (
                                            <Badge key={index} bg="info" className="small">
                                              {safeRender(spec, 'Unknown')}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      <div className="mb-3">
                                        <h6>Languages</h6>
                                        <div className="flex-wrap gap-1 d-flex">
                                          {instructor.languages?.map((lang, index) => (
                                            <Badge key={index} bg="success" className="small">
                                              {safeRender(lang, 'Unknown')}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </Col>
                                    
                                    <Col md={3}>
                                      <div className="mb-3">
                                        <h6>Pricing</h6>
                                        <p className="mb-1 small">💰 Hourly: ₹{safeRender(instructor.hourly_rate, '0')}</p>
                                        <p className="mb-1 small">📅 Monthly: ₹{safeRender(instructor.monthly_rate, '0')}</p>
                                        {instructor.quarterly_rate && (
                                          <p className="mb-1 small">📊 Quarterly: ₹{safeRender(instructor.quarterly_rate, '0')}</p>
                                        )}
                                        {instructor.half_yearly_rate && (
                                          <p className="mb-1 small">📈 Half-yearly: ₹{safeRender(instructor.half_yearly_rate, '0')}</p>
                                        )}
                                        {instructor.yearly_rate && (
                                          <p className="mb-1 small">📋 Yearly: ₹{safeRender(instructor.yearly_rate, '0')}</p>
                                        )}
                                      </div>
                                      
                                      <div className="mb-3">
                                        <h6>Services</h6>
                                        <p className="mb-1 small">🥗 Meal Planning: {safeRender(instructor.meal_planning)}</p>
                                        <p className="mb-1 small">🍎 Nutrition: {safeRender(instructor.nutrition_consultation)}</p>
                                        <p className="mb-1 small">📜 Certified: {safeRender(instructor.certification)}</p>
                                        <p className="mb-1 small">⏰ Available: {safeRender(instructor.availability)}</p>
                                      </div>
                                      
                                      <div className="mb-3">
                                        <h6>Emergency Contact</h6>
                                        <p className="mb-1 small">{safeRender(instructor.emergency_contact_relationship)}</p>
                                      </div>

                                      <div className="mb-3">
                                        <h6>📈 Enrollment Stats</h6>
                                        {enrollmentStats[instructor.userIdCl] ? (
                                          <>
                                            <p className="mb-1 small">
                                              <strong>Total Enrollments:</strong> {enrollmentStats[instructor.userIdCl].total}
                                            </p>
                                            <div className="gap-2 mb-2 d-flex">
                                              <Badge bg="warning" className="small">
                                                Pending: {enrollmentStats[instructor.userIdCl].pending}
                                              </Badge>
                                              <Badge bg="success" className="small">
                                                Active: {enrollmentStats[instructor.userIdCl].active}
                                              </Badge>
                                              <Badge bg="info" className="small">
                                                Completed: {enrollmentStats[instructor.userIdCl].completed}
                                              </Badge>
                                            </div>
                                            <Button
                                              variant="outline-info"
                                              size="sm"
                                              onClick={() => handleViewEnrollments(instructor)}
                                              className="mt-1"
                                            >
                                              View All Enrollments
                                            </Button>
                                          </>
                                        ) : (
                                          <p className="mb-1 small text-muted">No enrollments yet</p>
                                        )}
                                      </div>
                                    </Col>
                                  </Row>
                                  
                                  {/* Availability Section */}
                                  <Row className="mb-4">
                                    <Col md={6}>
                                      <h6>📅 Available Days</h6>
                                      <div className="flex-wrap gap-1 mt-2 d-flex">
                                        {instructor.availabilityDays?.map((day, index) => (
                                          <Badge key={index} bg="primary" className="small">
                                            {safeRender(day, 'Unknown')}
                                          </Badge>
                                        ))}
                                      </div>
                                    </Col>
                                    <Col md={3}>
                                      <h6>🕐 Available Hours</h6>
                                      <div className="flex-wrap gap-1 mt-2 d-flex">
                                        {instructor.availabilityHours?.map((hour, index) => (
                                          <Badge key={index} bg="warning" className="small">
                                            {safeRender(hour, 'Unknown')}
                                          </Badge>
                                        ))}
                                      </div>
                                    </Col>
                                    <Col md={3}>
                                      <h6>📍 Training Locations</h6>
                                      <div className="flex-wrap gap-1 mt-2 d-flex">
                                        {instructor.trainingLocations?.map((location, index) => (
                                          <Badge key={index} bg="dark" className="small">
                                            {safeRender(location, 'Unknown')}
                                          </Badge>
                                        ))}
                                      </div>
                                    </Col>
                                  </Row>

                                  {safeLength(instructor.certificationImages) > 0 && (
                                    <div className="mt-4">
                                      <h6>Certifications ({safeLength(instructor.certificationImages)})</h6>
                                      <div className="mt-2 certificate-gallery">
                                        {instructor.certificationImages.map((cert, index) => (
                                          <img
                                            key={index}
                                            src={cert}
                                            alt={`Certification ${index + 1}`}
                                            className="cert-image"
                                            title={`Certification ${index + 1}`}
                                          />
                                        ))}
                                      </div>
                                      {safeLength(instructor.certificationImages) > 1 && (
                                        <small className="text-muted">Scroll horizontally to view all certificates</small>
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </>
        ) : (
          <div className="p-5 text-center rounded bg-light">
            <h3 className="text-dark">{safeLength(instructors) === 0 ? "No Instructor Applications" : "No Results Found"}</h3>
            <p className="mt-2 text-muted">
              {safeLength(instructors) === 0 
                ? "When users apply to become instructors, they'll appear here." 
                : "Try adjusting your search criteria to find instructors."}
            </p>
          </div>
        )}
      </div>

      {/* Enrollment Off-Canvas */}
      <EnrollmentOffCanvas
        show={showEnrollmentOffCanvas}
        onHide={() => setShowEnrollmentOffCanvas(false)}
        mentorId={selectedInstructor?.userIdCl}
        mentorName={selectedInstructor ? safeRender(selectedInstructor.name, 'Unknown Instructor') : 'Unknown Instructor'}
      />
    </div>
  );
};

export default InstructorManagement;