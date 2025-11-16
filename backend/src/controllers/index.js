// Export all controllers
module.exports = {
  auth: require('./authController'),
  patients: require('./patientController'),
  appointments: require('./appointmentController'),
  prescriptions: require('./prescriptionController'),
  labs: require('./labController'),
  pharmacy: require('./pharmacyController'),
  billing: require('./billingController'),
  visits: require('./visitController'),
  users: require('./userController')
};
