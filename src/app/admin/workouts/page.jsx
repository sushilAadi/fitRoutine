"use client";
import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const WorkoutManagement = () => {
  const { user } = useContext(GlobalContext);
  const userRole = user?.publicMetadata?.role;

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [exercises, setExercises] = useState([]);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [workoutDrafts, setWorkoutDrafts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Exercise form state
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    bodyPart: '',
    equipment: '',
    gifUrl: '',
    instructions: [],
    secondaryMuscles: [],
    target: ''
  });
  
  // Plan template form state
  const [planTemplateForm, setPlanTemplateForm] = useState({
    name: '',
    description: '',
    duration: '',
    difficulty: 'beginner',
    category: '',
    weeks: 4,
    daysPerWeek: 3
  });

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);

  // Check if user is admin or coach
  if (userRole !== "admin" && userRole !== "coach") {
    return (
      <SecureComponent>
        <div className="flex flex-col items-center justify-center h-screen text-white bg-tprimary">
          <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
          <p className="mt-4 text-center">
            You don't have permission to access this page.
          </p>
        </div>
      </SecureComponent>
    );
  }

  // Load data
  useEffect(() => {
    loadWorkoutData();
  }, []);

  const loadWorkoutData = async () => {
    setLoading(true);
    try {
      // Load exercises
      const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
      const exercisesData = exercisesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExercises(exercisesData);

      // Load workout plans
      const plansSnapshot = await getDocs(
        query(collection(db, 'workoutPlans'), orderBy('createdAt', 'desc'))
      );
      const plansData = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkoutPlans(plansData);

      // Load workout drafts
      const draftsSnapshot = await getDocs(
        query(collection(db, 'workoutDrafts'), orderBy('createdAt', 'desc'))
      );
      const draftsData = draftsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkoutDrafts(draftsData);

      // Load clients (users who are not admin/coach)
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const clientsData = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(user => 
          user.publicMetadata?.role !== 'admin' && 
          user.publicMetadata?.role !== 'coach'
        );
      setClients(clientsData);

    } catch (error) {
      console.error('Error loading workout data:', error);
      toast.error('Failed to load workout data');
    } finally {
      setLoading(false);
    }
  };

  // Exercise management functions
  const handleSaveExercise = async () => {
    try {
      const exerciseData = {
        ...exerciseForm,
        instructions: exerciseForm.instructions.filter(inst => inst.trim() !== ''),
        secondaryMuscles: exerciseForm.secondaryMuscles.filter(muscle => muscle.trim() !== ''),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user?.id
      };

      if (editingExercise) {
        await updateDoc(doc(db, 'exercises', editingExercise.id), {
          ...exerciseData,
          updatedAt: new Date()
        });
        toast.success('Exercise updated successfully');
      } else {
        await addDoc(collection(db, 'exercises'), exerciseData);
        toast.success('Exercise added successfully');
      }

      setExerciseForm({
        name: '',
        bodyPart: '',
        equipment: '',
        gifUrl: '',
        instructions: [],
        secondaryMuscles: [],
        target: ''
      });
      setShowExerciseModal(false);
      setEditingExercise(null);
      loadWorkoutData();
    } catch (error) {
      console.error('Error saving exercise:', error);
      toast.error('Failed to save exercise');
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      try {
        await deleteDoc(doc(db, 'exercises', exerciseId));
        toast.success('Exercise deleted successfully');
        loadWorkoutData();
      } catch (error) {
        console.error('Error deleting exercise:', error);
        toast.error('Failed to delete exercise');
      }
    }
  };

  const handleEditExercise = (exercise) => {
    setEditingExercise(exercise);
    setExerciseForm({
      name: exercise.name || '',
      bodyPart: exercise.bodyPart || '',
      equipment: exercise.equipment || '',
      gifUrl: exercise.gifUrl || '',
      instructions: exercise.instructions || [],
      secondaryMuscles: exercise.secondaryMuscles || [],
      target: exercise.target || ''
    });
    setShowExerciseModal(true);
  };

  // Plan assignment functionality
  const handleAssignPlan = async (clientId, planId) => {
    try {
      const assignmentData = {
        clientId,
        planId,
        assignedAt: new Date(),
        assignedBy: user?.id,
        status: 'active',
        startDate: new Date(),
        progress: {
          currentWeek: 0,
          currentDay: 0,
          completedWorkouts: 0,
          totalWorkouts: 0
        }
      };

      await addDoc(collection(db, 'planAssignments'), assignmentData);
      toast.success('Plan assigned to client successfully');
      loadWorkoutData();
    } catch (error) {
      console.error('Error assigning plan:', error);
      toast.error('Failed to assign plan');
    }
  };

  // Plan template management
  const handleSavePlanTemplate = async () => {
    try {
      const templateData = {
        ...planTemplateForm,
        type: 'template',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user?.id,
        isTemplate: true
      };

      if (editingPlan) {
        await updateDoc(doc(db, 'workoutPlans', editingPlan.id), {
          ...templateData,
          updatedAt: new Date()
        });
        toast.success('Plan template updated successfully');
      } else {
        await addDoc(collection(db, 'workoutPlans'), templateData);
        toast.success('Plan template created successfully');
      }

      setPlanTemplateForm({
        name: '',
        description: '',
        duration: '',
        difficulty: 'beginner',
        category: '',
        weeks: 4,
        daysPerWeek: 3
      });
      setShowPlanModal(false);
      setEditingPlan(null);
      loadWorkoutData();
    } catch (error) {
      console.error('Error saving plan template:', error);
      toast.error('Failed to save plan template');
    }
  };

  // Filter functions
  const filteredExercises = exercises.filter(exercise =>
    exercise.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exercise.bodyPart?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exercise.target?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPlans = workoutPlans.filter(plan =>
    plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <SecureComponent>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading workout data...</p>
            </div>
          </div>
        </div>
      </SecureComponent>
    );
  }

  return (
    <SecureComponent>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Workout Management</h1>
          <p className="text-gray-600">Manage exercises, workout plans, and client assignments</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: 'fa-chart-pie' },
              { id: 'exercises', name: 'Exercise Library', icon: 'fa-dumbbell' },
              { id: 'plans', name: 'Workout Plans', icon: 'fa-list-ul' },
              { id: 'templates', name: 'Plan Templates', icon: 'fa-copy' },
              { id: 'assignments', name: 'Client Assignments', icon: 'fa-user-plus' },
              { id: 'progress', name: 'Progress Tracking', icon: 'fa-chart-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Exercises</p>
                  <p className="text-3xl font-bold text-blue-600">{exercises.length}</p>
                </div>
                <i className="fas fa-dumbbell text-3xl text-blue-500"></i>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Workout Plans</p>
                  <p className="text-3xl font-bold text-green-600">{workoutPlans.length}</p>
                </div>
                <i className="fas fa-list-ul text-3xl text-green-500"></i>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Draft Plans</p>
                  <p className="text-3xl font-bold text-orange-600">{workoutDrafts.length}</p>
                </div>
                <i className="fas fa-copy text-3xl text-orange-500"></i>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Clients</p>
                  <p className="text-3xl font-bold text-purple-600">{clients.length}</p>
                </div>
                <i className="fas fa-users text-3xl text-purple-500"></i>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'exercises' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button onClick={() => setShowExerciseModal(true)} className="ml-4">
                <i className="fas fa-plus mr-2"></i>
                Add Exercise
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises.map((exercise) => (
                <Card key={exercise.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{exercise.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditExercise(exercise)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Body Part:</span> {exercise.bodyPart}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Target:</span> {exercise.target}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Equipment:</span> {exercise.equipment}
                    </p>
                  </div>

                  {exercise.gifUrl && (
                    <div className="mt-4">
                      <img 
                        src={exercise.gifUrl} 
                        alt={exercise.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search workout plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button onClick={() => setShowPlanModal(true)} className="ml-4">
                <i className="fas fa-plus mr-2"></i>
                Create Plan Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <Card key={plan.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{plan.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setPlanTemplateForm({
                            name: plan.name || '',
                            description: plan.description || '',
                            duration: plan.duration || '',
                            difficulty: plan.difficulty || 'beginner',
                            category: plan.category || '',
                            weeks: plan.weeks || 4,
                            daysPerWeek: plan.daysPerWeek || 3
                          });
                          setShowPlanModal(true);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">{plan.description}</p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Duration:</span> {plan.weeks} weeks
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Days per week:</span> {plan.daysPerWeek}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Difficulty:</span> 
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                        plan.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                        plan.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {plan.difficulty}
                      </span>
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Additional tabs content would go here */}
        {activeTab === 'templates' && (
          <div className="text-center py-12">
            <i className="fas fa-copy text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Plan Templates</h3>
            <p className="text-gray-500">Manage reusable workout plan templates</p>
          </div>
        )}

        {activeTab === 'assignments' && (
          <ClientAssignments 
            clients={clients}
            workoutPlans={workoutPlans}
            onAssignPlan={handleAssignPlan}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressTracking 
            clients={clients}
            workoutPlans={workoutPlans}
          />
        )}

        {/* Exercise Modal */}
        {showExerciseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingExercise ? 'Edit Exercise' : 'Add New Exercise'}
                </h2>
                <button
                  onClick={() => {
                    setShowExerciseModal(false);
                    setEditingExercise(null);
                    setExerciseForm({
                      name: '',
                      bodyPart: '',
                      equipment: '',
                      gifUrl: '',
                      instructions: [],
                      secondaryMuscles: [],
                      target: ''
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                <Input
                  placeholder="Exercise name"
                  value={exerciseForm.name}
                  onChange={(e) => setExerciseForm({...exerciseForm, name: e.target.value})}
                />
                <Input
                  placeholder="Body part"
                  value={exerciseForm.bodyPart}
                  onChange={(e) => setExerciseForm({...exerciseForm, bodyPart: e.target.value})}
                />
                <Input
                  placeholder="Target muscle"
                  value={exerciseForm.target}
                  onChange={(e) => setExerciseForm({...exerciseForm, target: e.target.value})}
                />
                <Input
                  placeholder="Equipment"
                  value={exerciseForm.equipment}
                  onChange={(e) => setExerciseForm({...exerciseForm, equipment: e.target.value})}
                />
                <Input
                  placeholder="GIF URL"
                  value={exerciseForm.gifUrl}
                  onChange={(e) => setExerciseForm({...exerciseForm, gifUrl: e.target.value})}
                />
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowExerciseModal(false);
                    setEditingExercise(null);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveExercise}>
                    {editingExercise ? 'Update' : 'Add'} Exercise
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plan Template Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingPlan ? 'Edit Plan Template' : 'Create Plan Template'}
                </h2>
                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    setEditingPlan(null);
                    setPlanTemplateForm({
                      name: '',
                      description: '',
                      duration: '',
                      difficulty: 'beginner',
                      category: '',
                      weeks: 4,
                      daysPerWeek: 3
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                <Input
                  placeholder="Plan name"
                  value={planTemplateForm.name}
                  onChange={(e) => setPlanTemplateForm({...planTemplateForm, name: e.target.value})}
                />
                <textarea
                  placeholder="Description"
                  value={planTemplateForm.description}
                  onChange={(e) => setPlanTemplateForm({...planTemplateForm, description: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
                <Input
                  placeholder="Category"
                  value={planTemplateForm.category}
                  onChange={(e) => setPlanTemplateForm({...planTemplateForm, category: e.target.value})}
                />
                <select
                  value={planTemplateForm.difficulty}
                  onChange={(e) => setPlanTemplateForm({...planTemplateForm, difficulty: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Weeks"
                    value={planTemplateForm.weeks}
                    onChange={(e) => setPlanTemplateForm({...planTemplateForm, weeks: parseInt(e.target.value) || 4})}
                  />
                  <Input
                    type="number"
                    placeholder="Days/week"
                    value={planTemplateForm.daysPerWeek}
                    onChange={(e) => setPlanTemplateForm({...planTemplateForm, daysPerWeek: parseInt(e.target.value) || 3})}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowPlanModal(false);
                    setEditingPlan(null);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePlanTemplate}>
                    {editingPlan ? 'Update' : 'Create'} Template
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SecureComponent>
  );
};

// Client Assignments Component
const ClientAssignments = ({ clients, workoutPlans, onAssignPlan }) => {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const assignmentsSnapshot = await getDocs(
        query(collection(db, 'planAssignments'), orderBy('assignedAt', 'desc'))
      );
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedClient || !selectedPlan) {
      toast.error('Please select both client and plan');
      return;
    }

    await onAssignPlan(selectedClient, selectedPlan);
    setSelectedClient('');
    setSelectedPlan('');
    loadAssignments();
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : 'Unknown Client';
  };

  const getPlanName = (planId) => {
    const plan = workoutPlans.find(p => p.id === planId);
    return plan ? plan.name : 'Unknown Plan';
  };

  return (
    <div>
      {/* Assignment Form */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Assign Workout Plan to Client</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2">Select Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Choose a client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {`${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Select Plan</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Choose a plan...</option>
              {workoutPlans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
          
          <Button onClick={handleAssign}>
            <i className="fas fa-plus mr-2"></i>
            Assign Plan
          </Button>
        </div>
      </Card>

      {/* Current Assignments */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Current Assignments</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-clipboard-list text-4xl mb-2"></i>
            <p>No assignments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map(assignment => (
              <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{getClientName(assignment.clientId)}</h4>
                  <p className="text-sm text-gray-600">Plan: {getPlanName(assignment.planId)}</p>
                  <p className="text-sm text-gray-500">
                    Assigned: {assignment.assignedAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    assignment.status === 'active' ? 'bg-green-100 text-green-800' :
                    assignment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {assignment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// Progress Tracking Component
const ProgressTracking = ({ clients, workoutPlans }) => {
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      // Load user workout progress
      const progressSnapshot = await getDocs(collection(db, 'userWorkoutProgress'));
      const progressData = progressSnapshot.docs.map(doc => ({
        userId: doc.id,
        ...doc.data()
      }));

      // Load plan assignments
      const assignmentsSnapshot = await getDocs(collection(db, 'planAssignments'));
      const assignments = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Combine data
      const combinedData = clients.map(client => {
        const clientProgress = progressData.find(p => p.userId === client.id);
        const clientAssignments = assignments.filter(a => a.clientId === client.id);
        
        return {
          client,
          progress: clientProgress,
          assignments: clientAssignments
        };
      });

      setProgressData(combinedData);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (client) => {
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email;
  };

  const getPlanName = (planId) => {
    const plan = workoutPlans.find(p => p.id === planId);
    return plan ? plan.name : 'Unknown Plan';
  };

  const calculateProgress = (clientProgress, planId) => {
    if (!clientProgress || !clientProgress[planId]) return 0;
    
    const planData = clientProgress[planId];
    const totalSets = Object.keys(planData).length;
    const completedSets = Object.values(planData).filter(exercise => {
      if (Array.isArray(exercise)) {
        return exercise.some(set => set.isCompleted);
      }
      return false;
    }).length;
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading progress data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {progressData.map(({ client, progress, assignments }) => (
          <Card key={client.id} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={client.imageUrl || "https://www.aiscribbles.com/img/variant/large-preview/43289/?v=cbd7a5"}
                alt={getClientName(client)}
                className="w-12 h-12 rounded-full border"
              />
              <div>
                <h3 className="font-semibold">{getClientName(client)}</h3>
                <p className="text-sm text-gray-600">{client.email}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Plans:</span>
                <span className="text-sm text-gray-600">{assignments.length}</span>
              </div>
              
              {assignments.length > 0 ? (
                <div className="space-y-2">
                  {assignments.slice(0, 2).map(assignment => {
                    const progressPercentage = calculateProgress(progress, assignment.planId);
                    return (
                      <div key={assignment.id} className="text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-700">{getPlanName(assignment.planId)}</span>
                          <span className="text-gray-600">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  {assignments.length > 2 && (
                    <p className="text-xs text-gray-500">
                      +{assignments.length - 2} more plans
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <i className="fas fa-clipboard-list text-2xl mb-2"></i>
                  <p className="text-sm">No active plans</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WorkoutManagement;