"use client";
import React, { useEffect, useState, useContext } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { GlobalContext } from "@/context/GloablContext";
import { Row, Col, Badge, Table, Button } from "react-bootstrap";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
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

  const userRole = user?.publicMetadata?.role;

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const mentorsRef = collection(db, "Mentor");
      const snapshot = await getDocs(mentorsRef);
      
      const instructorsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setInstructors(instructorsList);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      toast.error("Failed to load instructors");
    } finally {
      setLoading(false);
    }
  };

  console.log("instructors", instructors);

  useEffect(() => {
    if (userRole === "admin" || userRole === "coach") {
      fetchInstructors();
    }
  }, [userRole]);

  const handleApproveInstructor = async (instructorId) => {
    try {
      const instructor = instructors.find(i => i.id === instructorId);
      if (!instructor) {
        toast.error("Instructor not found");
        return;
      }

      // Update Firestore status
      const instructorDoc = doc(db, "Mentor", instructorId);
      await updateDoc(instructorDoc, {
        status: "approved",
        approvedAt: new Date().toISOString()
      });

      // Update user role in Clerk (using the userIdCl from instructor data)
      if (instructor.userIdCl) {
        const response = await fetch('/api/admin/update-user-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId: instructor.userIdCl, 
            role: 'coach' 
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update user role in Clerk');
        }
      }
      
      toast.success("Instructor approved successfully! Role updated to coach.");
      fetchInstructors(); // Refresh list
    } catch (error) {
      console.error("Error approving instructor:", error);
      toast.error("Failed to approve instructor: " + error.message);
    }
  };

  const handleRejectInstructor = async (instructorId) => {
    try {
      const instructorDoc = doc(db, "Mentor", instructorId);
      await updateDoc(instructorDoc, {
        status: "rejected",
        rejectedAt: new Date().toISOString()
      });
      
      toast.success("Instructor rejected");
      fetchInstructors(); // Refresh list
    } catch (error) {
      console.error("Error rejecting instructor:", error);
      toast.error("Failed to reject instructor");
    }
  };

  const handleDeleteInstructor = async (instructorId) => {
    if (!confirm("Are you sure you want to delete this instructor? This action cannot be undone.")) {
      return;
    }

    try {
      const instructor = instructors.find(i => i.id === instructorId);
      if (!instructor) {
        toast.error("Instructor not found");
        return;
      }

      // Delete from Firestore
      const instructorDoc = doc(db, "Mentor", instructorId);
      await deleteDoc(instructorDoc);

      // Reset user role to 'user' in Clerk if they were approved
      if (instructor.userIdCl && instructor.status === "approved") {
        try {
          const response = await fetch('/api/admin/update-user-role', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              userId: instructor.userIdCl, 
              role: 'user' 
            }),
          });

          if (!response.ok) {
            console.error('Failed to reset user role in Clerk');
            toast.warning("Instructor deleted but role reset failed");
          }
        } catch (roleError) {
          console.error('Error resetting user role:', roleError);
          toast.warning("Instructor deleted but role reset failed");
        }
      }
      
      toast.success("Instructor deleted successfully");
      fetchInstructors(); // Refresh list
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

  const filterAndSortInstructors = () => {
    let filtered = instructors.filter(instructor => {
      // Text search filter
      const matchesSearch = instructor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
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
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
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
        ) : filteredAndSortedInstructors.length > 0 ? (
          <>
            {/* Search and Filter Controls */}
            <div className="mb-3 row align-items-end">
              <div className="col-md-6">
                <div className="gap-3 d-flex align-items-center">
                  <span className="text-muted">Total: {instructors.length} | </span>
                  <span className="text-warning">Pending: {instructors.filter(i => i.status === "pending" || !i.status).length} | </span>
                  <span className="text-success">Approved: {instructors.filter(i => i.status === "approved").length} | </span>
                  <span className="text-danger">Rejected: {instructors.filter(i => i.status === "rejected").length}</span>
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
                            <strong>{instructor.name}</strong>
                          </td>
                          <td style={{width: '200px'}}>{instructor.email}</td>
                          <td style={{width: '120px'}}>{instructor.experience_years} years</td>
                          <td style={{width: '100px'}}>
                            {getStatusBadge(instructor.status)}
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
                              <td colSpan="7" style={{ padding: 0, border: 'none' }}>
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
                                          className="profile-image rounded-lg mb-3"
                                        />
                                      )}
                                      {instructor.aadharImage && (
                                        <div>
                                          <h6 className="mb-2">Aadhar Document</h6>
                                          <img
                                            src={instructor.aadharImage}
                                            alt="Aadhar"
                                            className="document-image rounded"
                                          />
                                        </div>
                                      )}
                                    </Col>
                                    
                                    <Col md={3}>
                                      <h5 className="mb-3">{instructor.name}</h5>
                                      <div className="mb-2"><strong>Contact Info:</strong></div>
                                      <p className="mb-1 small">📧 {instructor.email}</p>
                                      <p className="mb-1 small">📱 {instructor.mobile}</p>
                                      <p className="mb-1 small">💬 {instructor.whatsapp}</p>
                                      {instructor.alternateNumber && (
                                        <p className="mb-1 small">📞 Alt: {instructor.alternateNumber}</p>
                                      )}
                                      <p className="mb-1 small">📮 Postal: {instructor.postal_code}</p>
                                      <p className="mb-1 small">🏢 Experience: {instructor.experience_years} years</p>
                                      <div className="mt-2">
                                        <strong>Status:</strong> {getStatusBadge(instructor.status)}
                                      </div>
                                    </Col>
                                    
                                    <Col md={3}>
                                      <div className="mb-3">
                                        <h6>About</h6>
                                        <p className="text-muted small">{instructor.AboutMe}</p>
                                      </div>
                                      
                                      <div className="mb-3">
                                        <h6>Qualifications</h6>
                                        <div className="d-flex flex-wrap gap-1">
                                          {instructor.qualifications?.map((qual, index) => (
                                            <Badge key={index} bg="secondary" className="small">{qual.label}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      <div className="mb-3">
                                        <h6>Specializations</h6>
                                        <div className="d-flex flex-wrap gap-1">
                                          {instructor.specializations?.map((spec, index) => (
                                            <Badge key={index} bg="info" className="small">{spec.label}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      <div className="mb-3">
                                        <h6>Languages</h6>
                                        <div className="d-flex flex-wrap gap-1">
                                          {instructor.languages?.map((lang, index) => (
                                            <Badge key={index} bg="success" className="small">{lang.label}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </Col>
                                    
                                    <Col md={3}>
                                      <div className="mb-3">
                                        <h6>Pricing</h6>
                                        <p className="mb-1 small">💰 Hourly: ₹{instructor.hourly_rate}</p>
                                        <p className="mb-1 small">📅 Monthly: ₹{instructor.monthly_rate}</p>
                                        {instructor.quarterly_rate && (
                                          <p className="mb-1 small">📊 Quarterly: ₹{instructor.quarterly_rate}</p>
                                        )}
                                        {instructor.half_yearly_rate && (
                                          <p className="mb-1 small">📈 Half-yearly: ₹{instructor.half_yearly_rate}</p>
                                        )}
                                        {instructor.yearly_rate && (
                                          <p className="mb-1 small">📋 Yearly: ₹{instructor.yearly_rate}</p>
                                        )}
                                      </div>
                                      
                                      <div className="mb-3">
                                        <h6>Services</h6>
                                        <p className="mb-1 small">🥗 Meal Planning: {instructor.meal_planning?.label || 'N/A'}</p>
                                        <p className="mb-1 small">🍎 Nutrition: {instructor.nutrition_consultation?.label || 'N/A'}</p>
                                        <p className="mb-1 small">📜 Certified: {instructor.certification?.label || 'N/A'}</p>
                                        <p className="mb-1 small">⏰ Available: {instructor.availability?.label || 'N/A'}</p>
                                      </div>
                                      
                                      <div className="mb-3">
                                        <h6>Emergency Contact</h6>
                                        <p className="mb-1 small">{instructor.emergency_contact_relationship || 'N/A'}</p>
                                      </div>
                                    </Col>
                                  </Row>
                                  
                                  {/* Availability Section */}
                                  <Row className="mb-4">
                                    <Col md={6}>
                                      <h6>📅 Available Days</h6>
                                      <div className="d-flex flex-wrap gap-1 mt-2">
                                        {instructor.availabilityDays?.map((day, index) => (
                                          <Badge key={index} bg="primary" className="small">{day.label}</Badge>
                                        ))}
                                      </div>
                                    </Col>
                                    <Col md={3}>
                                      <h6>🕐 Available Hours</h6>
                                      <div className="d-flex flex-wrap gap-1 mt-2">
                                        {instructor.availabilityHours?.map((hour, index) => (
                                          <Badge key={index} bg="warning" className="small">{hour.label}</Badge>
                                        ))}
                                      </div>
                                    </Col>
                                    <Col md={3}>
                                      <h6>📍 Training Locations</h6>
                                      <div className="d-flex flex-wrap gap-1 mt-2">
                                        {instructor.trainingLocations?.map((location, index) => (
                                          <Badge key={index} bg="dark" className="small">{location.label}</Badge>
                                        ))}
                                      </div>
                                    </Col>
                                  </Row>

                                  {instructor.certificationImages?.length > 0 && (
                                    <div className="mt-4">
                                      <h6>Certifications ({instructor.certificationImages.length})</h6>
                                      <div className="certificate-gallery mt-2">
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
                                      {instructor.certificationImages.length > 1 && (
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
            <h3 className="text-dark">{instructors.length === 0 ? "No Instructor Applications" : "No Results Found"}</h3>
            <p className="mt-2 text-muted">
              {instructors.length === 0 
                ? "When users apply to become instructors, they'll appear here." 
                : "Try adjusting your search criteria to find instructors."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorManagement;