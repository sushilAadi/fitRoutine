"use client";
import React, { useState, useEffect } from "react";
import { Offcanvas, Badge, Table, Button, Spinner } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const EnrollmentOffCanvas = ({ show, onHide, mentorId, mentorName }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedEnrollment, setExpandedEnrollment] = useState(null);

  // Ensure mentorName is always a string
  const displayName = typeof mentorName === 'string' ? mentorName : 'Instructor';

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
    if (!mentorId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/enrollments/instructor/${mentorId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }
      
      const data = await response.json();
      setEnrollments(data.enrollments || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      toast.error("Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && mentorId) {
      fetchEnrollments();
    }
  }, [show, mentorId]);

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

  const toggleEnrollmentExpansion = (enrollmentId) => {
    setExpandedEnrollment(expandedEnrollment === enrollmentId ? null : enrollmentId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isEndingSoon = (endDate) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Offcanvas 
      show={show} 
      onHide={onHide} 
      placement="end" 
      style={{ width: '60%', minWidth: '800px' }}
      className="enrollment-offcanvas"
    >
      <Offcanvas.Header closeButton className="text-white bg-primary">
        <Offcanvas.Title>
          <div>
            <h5 className="mb-1">Enrollments - {displayName}</h5>
            <small>Total: {stats.total || 0} enrollments</small>
          </div>
        </Offcanvas.Title>
      </Offcanvas.Header>
      
      <Offcanvas.Body className="p-0">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
            <Spinner animation="border" variant="primary" />
            <span className="ms-2">Loading enrollments...</span>
          </div>
        ) : (
          <>
            {/* Stats Section */}
            <div className="p-3 bg-light border-bottom">
              <div className="text-center row">
                <div className="col">
                  <div className="fw-bold text-primary">{stats.total || 0}</div>
                  <small className="text-muted">Total</small>
                </div>
                <div className="col">
                  <div className="fw-bold text-warning">{stats.pending || 0}</div>
                  <small className="text-muted">Pending</small>
                </div>
                <div className="col">
                  <div className="fw-bold text-success">{stats.active || 0}</div>
                  <small className="text-muted">Active</small>
                </div>
                <div className="col">
                  <div className="fw-bold text-info">{stats.completed || 0}</div>
                  <small className="text-muted">Completed</small>
                </div>
                <div className="col">
                  <div className="fw-bold text-danger">{stats.cancelled || 0}</div>
                  <small className="text-muted">Cancelled</small>
                </div>
                <div className="col">
                  <div className="fw-bold text-dark">₹{stats.totalRevenue || 0}</div>
                  <small className="text-muted">Revenue</small>
                </div>
              </div>
            </div>

            {/* Enrollments List */}
            <div className="flex-grow-1" style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
              {safeLength(enrollments) > 0 ? (
                <Table striped hover className="mb-0">
                  <thead className="bg-white sticky-top">
                    <tr>
                      <th>Client</th>
                      <th>Package</th>
                      <th>Rate</th>
                      <th>Status</th>
                      <th>Enrolled Date</th>
                      <th>Accepted</th>
                      <th>End Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment) => {
                      const endingSoon = isEndingSoon(enrollment.endDate);
                      const daysRemaining = getDaysRemaining(enrollment.endDate);
                      return (
                      <React.Fragment key={enrollment.id}>
                        <tr className={endingSoon ? 'table-danger' : ''}>
                          <td>
                            <div className="d-flex align-items-center">
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
                            <Badge bg="outline-primary" text="dark" className="text-capitalize">
                              {safeRender(enrollment.package?.type)}
                            </Badge>
                          </td>
                          <td>₹{safeRender(enrollment.package?.rate, '0')}</td>
                          <td>{getStatusBadge(enrollment.status)}</td>
                          <td>
                            <small>{formatDate(enrollment.enrolledAt)}</small>
                          </td>
                          <td>
                            <small className={enrollment.acceptedAt ? "text-success" : "text-muted"}>
                              {enrollment.acceptedAt ? formatDate(enrollment.acceptedAt) : 'Pending'}
                            </small>
                          </td>
                          <td>
                            {enrollment.endDate ? (
                              <div>
                                <small className={endingSoon ? 'text-danger fw-bold' : 'text-info'}>
                                  {formatDate(enrollment.endDate)}
                                </small>
                                {endingSoon && (
                                  <div>
                                    <small className="badge bg-danger">
                                      {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
                                    </small>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <small className="text-muted">Not set</small>
                            )}
                          </td>
                          <td>
                            <Button
                              variant={expandedEnrollment === enrollment.id ? "primary" : "outline-primary"}
                              size="sm"
                              onClick={() => toggleEnrollmentExpansion(enrollment.id)}
                            >
                              {expandedEnrollment === enrollment.id ? "Hide" : "Details"}
                            </Button>
                          </td>
                        </tr>
                        
                        <AnimatePresence>
                          {expandedEnrollment === enrollment.id && (
                            <motion.tr
                              key={`expanded-${enrollment.id}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <td colSpan="8" className="bg-light">
                                <motion.div
                                  className="p-3"
                                  initial={{ y: -10, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  exit={{ y: -10, opacity: 0 }}
                                  transition={{ duration: 0.2, delay: 0.1 }}
                                >
                                  <div className="row">
                                    <div className="col-md-6">
                                      <h6 className="mb-2 text-primary">Client Details</h6>
                                      <p className="mb-1"><strong>Name:</strong> {safeRender(enrollment.package?.fullName)}</p>
                                      <p className="mb-1"><strong>Phone:</strong> {safeRender(enrollment.package?.phoneNumber)}</p>
                                      <p className="mb-1"><strong>Email:</strong> {safeRender(enrollment.clientEmail)}</p>
                                      
                                      {enrollment.clientDetails && (
                                        <>
                                          <p className="mb-1"><strong>Gender:</strong> {safeRender(enrollment.clientDetails.gender)}</p>
                                          <p className="mb-1"><strong>Height:</strong> {safeRender(enrollment.clientDetails.height)} cm</p>
                                          <p className="mb-1"><strong>Weight:</strong> {safeRender(enrollment.clientDetails.weight)} kg</p>
                                          <p className="mb-1"><strong>Goals:</strong> {safeRender(enrollment.clientDetails.goals)}</p>
                                          <p className="mb-1"><strong>Activity Level:</strong> {safeRender(enrollment.clientDetails.activityLevel)}</p>
                                        </>
                                      )}
                                    </div>
                                    
                                    <div className="col-md-6">
                                      <h6 className="mb-2 text-primary">Package & Availability</h6>
                                      <p className="mb-1"><strong>Package Type:</strong> {safeRender(enrollment.package?.type)}</p>
                                      <p className="mb-1"><strong>Rate:</strong> ₹{safeRender(enrollment.package?.rate, '0')}</p>
                                      
                                      {enrollment.package?.availability && (
                                        <>
                                          <p className="mb-1"><strong>Available Days:</strong></p>
                                          <div className="flex-wrap gap-1 mb-2 d-flex">
                                            {enrollment.package.availability.days?.map((day, index) => (
                                              <Badge key={index} bg="secondary" className="small">{safeRender(day)}</Badge>
                                            ))}
                                          </div>
                                          <p className="mb-1"><strong>Time Slot:</strong> {safeRender(enrollment.package.availability.timeSlot)}</p>
                                        </>
                                      )}
                                      
                                      {enrollment.package?.trainingLocations && (
                                        <>
                                          <p className="mb-1"><strong>Training Locations:</strong></p>
                                          <div className="flex-wrap gap-1 d-flex">
                                            {Array.isArray(enrollment.package.trainingLocations) 
                                              ? enrollment.package.trainingLocations.map((location, index) => (
                                                  <Badge key={index} bg="info" className="small">{safeRender(location)}</Badge>
                                                ))
                                              : <Badge bg="info" className="small">{safeRender(enrollment.package.trainingLocations)}</Badge>
                                            }
                                          </div>
                                        </>
                                      )}
                                      
                                      <div className="mt-3">
                                        <p className="mb-1"><strong>Enrolled:</strong> {formatDate(enrollment.enrolledAt)}</p>
                                        <p className="mb-1"><strong>Accepted:</strong> 
                                          <span className={enrollment.acceptedAt ? "text-success ms-1" : "text-muted ms-1"}>
                                            {enrollment.acceptedAt ? formatDate(enrollment.acceptedAt) : 'Not accepted yet'}
                                          </span>
                                        </p>
                                        <p className="mb-1"><strong>End Date:</strong> 
                                          {enrollment.endDate ? (
                                            <span className={endingSoon ? 'text-danger fw-bold ms-1' : 'text-info ms-1'}>
                                              {formatDate(enrollment.endDate)}
                                              {endingSoon && (
                                                <span className="badge bg-danger ms-2">
                                                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left!
                                                </span>
                                              )}
                                            </span>
                                          ) : (
                                            <span className="text-muted ms-1">Not set</span>
                                          )}
                                        </p>
                                        {enrollment.updatedAt && enrollment.updatedAt !== enrollment.enrolledAt && (
                                          <p className="mb-1"><strong>Last Updated:</strong> {formatDate(enrollment.updatedAt)}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <div className="p-5 text-center">
                  <h5 className="text-muted">No Enrollments Found</h5>
                  <p className="text-muted">This instructor doesn't have any enrollments yet.</p>
                </div>
              )}
            </div>
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default EnrollmentOffCanvas;