import { auth } from '@clerk/nextjs';

/**
 * Updates user role in Clerk's public metadata
 * Note: This would typically be done on the backend for security
 * For now, this shows the structure needed
 */
export const updateUserRoleInClerk = async (userId, role) => {
  try {
    // This is a client-side placeholder
    // In production, you should implement this server-side API endpoint
    const response = await fetch('/api/admin/update-user-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, role }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user role');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Helper function to format instructor data
 */
export const formatInstructorData = (instructor) => {
  return {
    ...instructor,
    formattedDate: new Date(instructor.uploadedAt).toLocaleDateString(),
    experienceYears: instructor.experience_years || 0,
    qualificationsList: instructor.qualifications?.map(q => q.label).join(', ') || '',
    specializationsList: instructor.specializations?.map(s => s.label).join(', ') || '',
    languagesList: instructor.languages?.map(l => l.label).join(', ') || '',
  };
};

/**
 * Status color mapping for badges
 */
export const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    default: 'secondary'
  };
  return colors[status] || colors.default;
};