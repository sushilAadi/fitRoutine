"use client";
import React, { useEffect, useState, useContext } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { GlobalContext } from "@/context/GloablContext";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import AdminSidebar from "@/components/Sidebar/AdminSidebar";
import { Row, Col, Badge, Table, Button } from "react-bootstrap";
import ButtonCs from "@/components/Button/ButtonCs";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const { user, handleOpenClose } = useContext(GlobalContext);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  const openInstructorModal = (instructor) => {
    setSelectedInstructor(instructor);
    setShowModal(true);
  };

  // Check if user is admin or coach (both can manage instructors)
  if (userRole !== "admin" && userRole !== "coach") {
    return (
      <SecureComponent>
        <div className="flex flex-col items-center justify-center h-screen text-white bg-tprimary">
          <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
          <p className="mt-4 text-center">
            You don't have permission to access this page.
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
      <div className="min-h-screen bg-light">
        <AdminSidebar />
        
        {/* Main Content */}
        <div className="admin-content">
          {/* Header */}
          <div className="p-4 mb-4 bg-white shadow-sm border-bottom">
            <div>
              <h1 className="mb-2 h2 text-dark fw-bold">Instructor Management</h1>
              <p className="mb-0 text-muted">Manage instructor applications and approvals</p>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 container-fluid">
            {/* Statistics Cards */}
            <div className="mb-4 row">
              <div className="col-md-3">
                <div className="p-4 bg-white rounded shadow-sm border">
                  <div className="text-center">
                    <div className="mb-1 h3 text-primary">{instructors.length}</div>
                    <p className="mb-0 text-muted">Total Instructors</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-4 bg-white rounded shadow-sm border">
                  <div className="text-center">
                    <div className="mb-1 h3 text-warning">
                      {instructors.filter(i => i.status === "pending" || !i.status).length}
                    </div>
                    <p className="mb-0 text-muted">Pending Applications</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-4 bg-white rounded shadow-sm border">
                  <div className="text-center">
                    <div className="mb-1 h3 text-success">
                      {instructors.filter(i => i.status === "approved").length}
                    </div>
                    <p className="mb-0 text-muted">Approved Instructors</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-4 bg-white rounded shadow-sm border">
                  <div className="text-center">
                    <div className="mb-1 h3 text-danger">
                      {instructors.filter(i => i.status === "rejected").length}
                    </div>
                    <p className="mb-0 text-muted">Rejected Applications</p>
                  </div>
                </div>
              </div>
            </div>

          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading instructors...</p>
            </div>
          ) : instructors.length > 0 ? (
            <div className="bg-white rounded shadow">
              <Table striped bordered hover responsive>
                <thead className="text-white bg-primary">
                  <tr>
                    <th>Profile</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Experience</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {instructors.map((instructor) => (
                    <tr key={instructor.id}>
                      <td>
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
                      <td>
                        <strong>{instructor.name}</strong>
                      </td>
                      <td>{instructor.email}</td>
                      <td>{instructor.experience_years} years</td>
                      <td>
                        {getStatusBadge(instructor.status)}
                      </td>
                      <td>
                        {new Date(instructor.uploadedAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex-wrap gap-1 d-flex">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openInstructorModal(instructor)}
                          >
                            View
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
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="p-5 text-center rounded bg-light">
              <h3 className="text-dark">No Instructor Applications</h3>
              <p className="mt-2 text-muted">
                When users apply to become instructors, they'll appear here.
              </p>
            </div>
          )}
        </div>

        {/* Instructor Detail Modal */}
        {showModal && selectedInstructor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-lg shadow-lg">
              <div className="sticky top-0 flex items-center justify-between p-4 bg-white border-b">
                <h3 className="text-xl font-bold text-dark">Instructor Details</h3>
                <button
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                />
              </div>
              
              <div className="p-4 text-dark">
                <Row>
                  <Col md={4}>
                    {selectedInstructor.profileImage && (
                      <img
                        src={selectedInstructor.profileImage}
                        alt="Profile"
                        className="object-cover w-full rounded-lg"
                      />
                    )}
                  </Col>
                  <Col md={8}>
                    <h4>{selectedInstructor.name}</h4>
                    <p className="text-muted">{selectedInstructor.email}</p>
                    <p className="text-muted">Mobile: {selectedInstructor.mobile}</p>
                    <p className="text-muted">WhatsApp: {selectedInstructor.whatsapp}</p>
                    <p className="text-muted">Experience: {selectedInstructor.experience_years} years</p>
                    <div className="mt-2">
                      Status: {getStatusBadge(selectedInstructor.status)}
                    </div>
                  </Col>
                </Row>
                
                <Row className="mt-4">
                  <Col md={6}>
                    <h5>About</h5>
                    <p className="text-muted">{selectedInstructor.AboutMe}</p>
                  </Col>
                  <Col md={6}>
                    <h5>Qualifications</h5>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedInstructor.qualifications?.map((qual, index) => (
                        <Badge key={index} bg="secondary">{qual.label}</Badge>
                      ))}
                    </div>
                  </Col>
                </Row>
                
                <Row className="mt-4">
                  <Col md={6}>
                    <h5>Specializations</h5>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedInstructor.specializations?.map((spec, index) => (
                        <Badge key={index} bg="info">{spec.label}</Badge>
                      ))}
                    </div>
                  </Col>
                  <Col md={6}>
                    <h5>Languages</h5>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedInstructor.languages?.map((lang, index) => (
                        <Badge key={index} bg="success">{lang.label}</Badge>
                      ))}
                    </div>
                  </Col>
                </Row>

                <Row className="mt-4">
                  <Col md={6}>
                    <h5>Hourly Rate</h5>
                    <p className="text-muted">₹{selectedInstructor.hourly_rate}</p>
                  </Col>
                  <Col md={6}>
                    <h5>Monthly Rate</h5>
                    <p className="text-muted">₹{selectedInstructor.monthly_rate}</p>
                  </Col>
                </Row>

                {selectedInstructor.certificationImages?.length > 0 && (
                  <div className="mt-4">
                    <h5>Certifications</h5>
                    <div className="flex mt-2 space-x-2 overflow-x-auto">
                      {selectedInstructor.certificationImages.map((cert, index) => (
                        <img
                          key={index}
                          src={cert}
                          alt={`Certification ${index + 1}`}
                          className="object-cover w-32 h-32 rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </SecureComponent>
  );
};

export default AdminDashboard;