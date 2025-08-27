"use client";
import React, { useEffect, useState, useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import { Badge, Table, Button, Form, Row, Col } from "react-bootstrap";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const EnrollmentManagement = () => {
  const { user } = useContext(GlobalContext);
  const [enrollments, setEnrollments] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("enrolledAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filteredAndSortedEnrollments, setFilteredAndSortedEnrollments] = useState([]);

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

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/admin/enrollments?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }
      
      const data = await response.json();
      setEnrollments(data.enrollments || []);
      setStatusCounts(data.statusCounts || {});
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      toast.error("Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "admin" || userRole === "coach") {
      fetchEnrollments();
    }
  }, [userRole, statusFilter]);

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "warning",
      active: "success",
      completed: "info",
      cancelled: "danger"
    };
    
    return (
      <Badge bg={statusColors[status] || "secondary"} className="text-capitalize">
        {status || "pending"}
      </Badge>
    );
  };

  const toggleRowExpansion = (enrollmentId) => {
    setExpandedRow(expandedRow === enrollmentId ? null : enrollmentId);
  };

  const filterAndSortEnrollments = () => {
    let filtered = enrollments.filter(enrollment => {
      // Text search filter
      const matchesSearch = enrollment.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           enrollment.mentorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           enrollment.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    // Sort enrollments
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch(sortBy) {
        case "clientName":
          aValue = a.clientName?.toLowerCase() || "";
          bValue = b.clientName?.toLowerCase() || "";
          break;
        case "mentorName":
          aValue = a.mentorName?.toLowerCase() || "";
          bValue = b.mentorName?.toLowerCase() || "";
          break;
        case "status":
          aValue = a.status?.toLowerCase() || "pending";
          bValue = b.status?.toLowerCase() || "pending";
          break;
        case "enrolledAt":
        default:
          aValue = new Date(a.enrolledAt || 0);
          bValue = new Date(b.enrolledAt || 0);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAndSortedEnrollments(filtered);
  };

  useEffect(() => {
    filterAndSortEnrollments();
  }, [enrollments, searchTerm, sortBy, sortOrder]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Check if user has access
  if (userRole !== "admin" && userRole !== "coach") {
    return (
      <div className="p-4 container-fluid">
        <div className="text-center">
          <h3 className="text-danger">Access Denied</h3>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enrollment-management">
      {/* Header */}
      <div className="p-4 mb-4 bg-white shadow-sm border-bottom">
        <div>
          <h1 className="mb-2 h2 text-dark fw-bold">Enrollment Management</h1>
          <p className="mb-0 text-muted">Manage all client enrollments and coaching relationships</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 container-fluid content-container">
        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading enrollments...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="mb-4 row">
              <div className="col-md-2">
                <div className="text-center card">
                  <div className="card-body">
                    <h5 className="card-title text-primary">{statusCounts.total || 0}</h5>
                    <p className="card-text small text-muted">Total Enrollments</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center card">
                  <div className="card-body">
                    <h5 className="card-title text-warning">{statusCounts.pending || 0}</h5>
                    <p className="card-text small text-muted">Pending</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center card">
                  <div className="card-body">
                    <h5 className="card-title text-success">{statusCounts.active || 0}</h5>
                    <p className="card-text small text-muted">Active</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center card">
                  <div className="card-body">
                    <h5 className="card-title text-info">{statusCounts.completed || 0}</h5>
                    <p className="card-text small text-muted">Completed</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="text-center card">
                  <div className="card-body">
                    <h5 className="card-title text-danger">{statusCounts.cancelled || 0}</h5>
                    <p className="card-text small text-muted">Cancelled</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="mb-3 row align-items-end">
              <div className="col-md-6">
                <Form.Control
                  type="text"
                  placeholder="Search by client name, mentor name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <Form.Select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </div>
              <div className="col-md-3">
                <Form.Select 
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                >
                  <option value="enrolledAt-desc">Latest First</option>
                  <option value="enrolledAt-asc">Oldest First</option>
                  <option value="clientName-asc">Client A-Z</option>
                  <option value="clientName-desc">Client Z-A</option>
                  <option value="mentorName-asc">Mentor A-Z</option>
                  <option value="mentorName-desc">Mentor Z-A</option>
                </Form.Select>
              </div>
            </div>

            {safeLength(filteredAndSortedEnrollments) > 0 ? (
              <div className="bg-white rounded shadow table-container">
                <div className="table-responsive">
                  <Table striped bordered hover className="mb-0">
                    <thead className="text-white bg-primary">
                      <tr>
                        <th>Client</th>
                        <th>Mentor</th>
                        <th>Package</th>
                        <th>Rate</th>
                        <th>Status</th>
                        <th>Enrolled Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedEnrollments.map((enrollment) => (
                        <React.Fragment key={enrollment.id}>
                          <tr>
                            <td>
                              <div className="d-flex align-items-center ">
                                {enrollment.package?.profileImage && (
                                  <img
                                    src={enrollment.package.profileImage}
                                    alt="Client"
                                    className="rounded-circle me-2 w-[50px] h-[50px]"
                                    width="40"
                                    height="40"
                                    style={{ objectFit: 'cover' }}
                                  />
                                )}
                                <div>
                                  <div className="fw-bold">{safeRender(enrollment.clientName)}</div>
                                  <small className="text-muted">{safeRender(enrollment.clientEmail)}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center ">
                                {enrollment.mentorProfileImage && (
                                  <img
                                    src={enrollment.mentorProfileImage}
                                    alt="Mentor"
                                    className="rounded-circle me-2 w-[50px] h-[50px]"
                                    width="40"
                                    height="40"
                                    style={{ objectFit: 'cover' }}
                                  />
                                )}
                                <div>
                                  <div className="fw-bold">{safeRender(enrollment.mentorName)}</div>
                                  <small className="text-muted">{safeRender(enrollment.mentorEmail)}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <Badge bg="outline-primary" text="dark" className="text-capitalize">
                                {safeRender(enrollment.package?.type)}
                              </Badge>
                            </td>
                            <td className="fw-bold">₹{safeRender(enrollment.package?.rate, '0')}</td>
                            <td>{getStatusBadge(enrollment.status)}</td>
                            <td>
                              <small>{formatDate(enrollment.enrolledAt)}</small>
                            </td>
                            <td>
                              <Button
                                variant={expandedRow === enrollment.id ? "primary" : "outline-primary"}
                                size="sm"
                                onClick={() => toggleRowExpansion(enrollment.id)}
                              >
                                {expandedRow === enrollment.id ? "Hide" : "Details"}
                              </Button>
                            </td>
                          </tr>

                          <AnimatePresence>
                            {expandedRow === enrollment.id && (
                              <motion.tr
                                key={`expanded-${enrollment.id}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <td colSpan="7" className="bg-light">
                                  <motion.div
                                    className="p-4"
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    transition={{ duration: 0.2, delay: 0.1 }}
                                  >
                                    <Row>
                                      <Col md={6}>
                                        <h6 className="mb-3 text-primary">Client Information</h6>
                                        <p><strong>Full Name:</strong> {safeRender(enrollment.package?.fullName)}</p>
                                        <p><strong>Phone:</strong> {safeRender(enrollment.package?.phoneNumber)}</p>
                                        <p><strong>Email:</strong> {safeRender(enrollment.clientEmail)}</p>
                                        
                                        {enrollment.clientDetails && (
                                          <>
                                            <h6 className="mt-4 mb-2 text-primary">Physical Details</h6>
                                            <p><strong>Gender:</strong> {safeRender(enrollment.clientDetails.gender)}</p>
                                            <p><strong>Height:</strong> {safeRender(enrollment.clientDetails.height)} cm</p>
                                            <p><strong>Weight:</strong> {safeRender(enrollment.clientDetails.weight)} kg</p>
                                            <p><strong>Goals:</strong> {safeRender(enrollment.clientDetails.goals)}</p>
                                            <p><strong>Activity Level:</strong> {safeRender(enrollment.clientDetails.activityLevel)}</p>
                                          </>
                                        )}
                                      </Col>
                                      
                                      <Col md={6}>
                                        <h6 className="mb-3 text-primary">Package & Schedule</h6>
                                        <p><strong>Package Type:</strong> {safeRender(enrollment.package?.type)}</p>
                                        <p><strong>Rate:</strong> ₹{safeRender(enrollment.package?.rate, '0')}</p>
                                        
                                        {enrollment.package?.availability && (
                                          <>
                                            <p><strong>Available Days:</strong></p>
                                            <div className="flex-wrap gap-1 mb-2 d-flex">
                                              {enrollment.package.availability.days?.map((day, index) => (
                                                <Badge key={index} bg="secondary" className="small">{safeRender(day)}</Badge>
                                              ))}
                                            </div>
                                            <p><strong>Time Slot:</strong> {safeRender(enrollment.package.availability.timeSlot)}</p>
                                          </>
                                        )}
                                        
                                        {enrollment.package?.trainingLocations && (
                                          <>
                                            <p><strong>Training Locations:</strong></p>
                                            <div className="flex-wrap gap-1 mb-3 d-flex">
                                              {Array.isArray(enrollment.package.trainingLocations) 
                                                ? enrollment.package.trainingLocations.map((location, index) => (
                                                    <Badge key={index} bg="info" className="small">{safeRender(location)}</Badge>
                                                  ))
                                                : <Badge bg="info" className="small">{safeRender(enrollment.package.trainingLocations)}</Badge>
                                              }
                                            </div>
                                          </>
                                        )}
                                        
                                        <p><strong>Enrolled:</strong> {formatDate(enrollment.enrolledAt)}</p>
                                        <p><strong>Status:</strong> {getStatusBadge(enrollment.status)}</p>
                                      </Col>
                                    </Row>
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
            ) : (
              <div className="p-5 text-center rounded bg-light">
                <h3 className="text-dark">
                  {safeLength(enrollments) === 0 ? "No Enrollments Found" : "No Results Found"}
                </h3>
                <p className="mt-2 text-muted">
                  {safeLength(enrollments) === 0 
                    ? "When clients enroll with instructors, they'll appear here." 
                    : "Try adjusting your search criteria to find enrollments."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EnrollmentManagement;