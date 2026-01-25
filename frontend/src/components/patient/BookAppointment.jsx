import React, { useState } from 'react';
import {
  Search, Filter, MapPin, Star, Calendar, Clock,
  Award, MessageCircle, ChevronRight, X, Check
} from 'lucide-react';
import { availableDoctors, specialties, sortOptions } from '../../data/doctorsData';

const BookAppointment = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [sortBy, setSortBy] = useState('recommended');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Filter doctors based on search and specialty
  const filteredDoctors = availableDoctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All Specialties' ||
                            doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  // Sort doctors
  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'distance':
        return parseFloat(a.distance) - parseFloat(b.distance);
      case 'fee-low':
        return a.consultationFee - b.consultationFee;
      case 'fee-high':
        return b.consultationFee - a.consultationFee;
      case 'experience':
        return b.experience - a.experience;
      default:
        return 0;
    }
  });

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDay(null);
    setSelectedSlot(null);
    setShowBookingModal(true);
  };

  const confirmBooking = () => {
    // Here you would normally make an API call to book the appointment
    alert(`Appointment booked with ${selectedDoctor.name} on ${selectedDay} at ${selectedSlot}`);
    setShowBookingModal(false);
    setSelectedDoctor(null);
    setSelectedDay(null);
    setSelectedSlot(null);
  };

  const DoctorCard = ({ doctor }) => (
    <div className="card hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
      <div className="flex items-start space-x-4">
        {/* Doctor Image */}
        <div className="flex-shrink-0">
          <img
            src={doctor.image}
            alt={doctor.name}
            className="w-20 h-20 rounded-xl border-2 border-gray-200 dark:border-gray-700"
          />
        </div>

        {/* Doctor Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{doctor.name}</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">{doctor.specialty}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{doctor.qualification}</p>
            </div>
            <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 text-green-600 dark:text-green-400 fill-current" />
              <span className="text-sm font-bold text-green-900 dark:text-green-200">{doctor.rating}</span>
              <span className="text-xs text-green-700 dark:text-green-300">({doctor.reviews})</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{doctor.experience} years exp.</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{doctor.distance}</span>
            </div>
          </div>

          {/* Hospital Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{doctor.hospital}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{doctor.location}</p>
          </div>

          {/* Languages */}
          <div className="flex flex-wrap gap-1 mb-3">
            {doctor.languages.map((lang, index) => (
              <span
                key={index}
                className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full"
              >
                {lang}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Consultation Fee</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">₹{doctor.consultationFee}</p>
            </div>
            <button
              onClick={() => handleBookAppointment(doctor)}
              className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <span>Book Appointment</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const BookingModal = () => {
    if (!selectedDoctor) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={selectedDoctor.image}
                alt={selectedDoctor.name}
                className="w-16 h-16 rounded-xl border-2 border-gray-200 dark:border-gray-700"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedDoctor.name}</h2>
                <p className="text-sm text-blue-600 dark:text-blue-400">{selectedDoctor.specialty}</p>
              </div>
            </div>
            <button
              onClick={() => setShowBookingModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {/* Select Day */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                Select Day
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {selectedDoctor.availability.map((daySlot) => (
                  <button
                    key={daySlot.day}
                    onClick={() => {
                      setSelectedDay(daySlot.day);
                      setSelectedSlot(null);
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedDay === daySlot.day
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-200'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <p className="text-sm font-semibold">{daySlot.day}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{daySlot.slots.length} slots</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Time Slot */}
            {selectedDay && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Select Time Slot
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {selectedDoctor.availability
                    .find(d => d.day === selectedDay)
                    ?.slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedSlot === slot
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-200'
                            : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <p className="text-sm font-semibold">{slot}</p>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Booking Summary */}
            {selectedDay && selectedSlot && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Doctor:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedDoctor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Specialty:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedDoctor.specialty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Hospital:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedDoctor.hospital}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date & Time:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedDay}, {selectedSlot}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-300 dark:border-green-700">
                    <span className="text-gray-600 dark:text-gray-400">Consultation Fee:</span>
                    <span className="font-bold text-lg text-green-900 dark:text-green-200">₹{selectedDoctor.consultationFee}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmBooking}
                disabled={!selectedDay || !selectedSlot}
                className="flex-1 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Check className="w-5 h-5" />
                <span>Confirm Booking</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Book Appointment</h2>
        <p className="text-gray-600 dark:text-gray-400">Find and book appointments with doctors near you</p>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6 hover:shadow-xl transition-all duration-200">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by doctor name or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Filters Row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Specialty Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Specialty
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-4 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`
                }}
              >
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`
                }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{sortedDoctors.length}</span> doctors
          {selectedSpecialty !== 'All Specialties' && (
            <span> in <span className="font-semibold text-gray-900 dark:text-white">{selectedSpecialty}</span></span>
          )}
        </p>
      </div>

      {/* Doctors List */}
      <div className="space-y-4">
        {sortedDoctors.length > 0 ? (
          sortedDoctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))
        ) : (
          <div className="card text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No doctors found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && <BookingModal />}
    </div>
  );
};

export default BookAppointment;
