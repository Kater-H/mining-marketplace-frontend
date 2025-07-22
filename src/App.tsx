import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Lucide React Icons
import {
  ShoppingBag,
  User,
  LogOut,
  Home,
  Search,
  MapPin,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  Edit,
  Eye,
  ArrowLeft,
  Plus,
  Check,
  X, // Added for modal close button
  CreditCard, // Added for payment modal
  UserPlus, // For register form icon
  LogIn, // For login form icon
  CheckCircle, // For success icon
  XCircle, // For cancel icon
  ShieldCheck, // For compliant status
  ShieldOff, // For non-compliant status
  ShieldQuestion // For pending status
} from 'lucide-react';

// Types
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'buyer' | 'miner' | 'admin';
  emailVerified: boolean;
  memberSince: string; // Assuming a string date like "January 15, 2024"
  companyName?: string;
  phoneNumber?: string;
  // NEW: Add complianceStatus
  complianceStatus: 'pending' | 'compliant' | 'non_compliant'; 
}

interface Listing {
  id: number;
  seller_id: number;
  mineral_type: string;
  description: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  currency: string;
  location: string;
  status: 'available' | 'pending' | 'sold' | 'canceled';
  listed_date: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

interface Offer {
  id: number;
  listing_id: number;
  buyer_id: number;
  offer_price: number;
  offer_quantity: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed';
  created_at: string;
  updated_at: string;
  currency: string;
  buyer_first_name?: string;
  buyer_last_name?: string;
  listing_mineral_type?: string;
  listing_location?: string;
  listing_price_per_unit?: number;
  listing_quantity?: number;
  listing_currency?: string;
}

interface Transaction {
  id: number;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  offer_id?: number | null;
  final_price: number;
  final_quantity: number;
  currency: string;
  transaction_date: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_gateway_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Base URL for your backend API
const API_BASE_URL = 'https://mining-marketplace-backend-b4st.onrender.com/api';

// API Helper Function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error or malformed JSON response' }));
    throw new Error(errorData.message || `HTTP ${response.status} Error`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// --- Custom Message Box Component ---
interface MessageBoxProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const MessageBox: React.FC<MessageBoxProps> = ({ message, type, onClose }) => {
  const bgColorClass = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-orange-500',
  }[type];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${bgColorClass} text-white p-6 rounded-lg shadow-xl max-w-sm w-full relative`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:text-gray-200"
          aria-label="Close message"
        >
          <X className="w-5 h-5" />
        </button>
        <p className="text-lg font-semibold mb-4">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
        <p className="text-sm">{message}</p>
        <div className="mt-6 text-right">
          <button onClick={onClose} className="bg-white text-gray-800 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
            OK
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Component Definitions ---

// Login Form Component
const LoginForm: React.FC<{
  onLogin: (user: User) => void;
  onSwitchToRegister: () => void;
}> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiCall('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('authToken', response.token);

      const loggedInUser: User = {
        id: response.user.id,
        firstName: response.user.firstName, 
        lastName: response.user.lastName,   
        email: response.user.email,
        role: response.user.role,
        emailVerified: response.user.emailVerified, 
        memberSince: response.user.memberSince,     
        companyName: response.user.companyName, 
        phoneNumber: response.user.phoneNumber, 
        complianceStatus: response.user.complianceStatus, 
      };
      console.log("Frontend: User data received on successful login from backend:", response.user); 
      console.log("Frontend: Mapped user data on successful login:", loggedInUser); 
      onLogin(loggedInUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    localStorage.setItem('authToken', 'mock-admin-token-for-demo');
    onLogin({
      id: 1,
      firstName: 'Demo',
      lastName: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
      emailVerified: true,
      memberSince: '2023-01-01',
      complianceStatus: 'compliant' // Demo admin is compliant
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mining Marketplace</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner w-5 h-5 mr-2"></div>
            ) : (
              <LogIn className="w-5 h-5 mr-2" />
            )}
            Sign In
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn-secondary w-full"
          >
            <Eye className="w-5 h-5 mr-2" />
            Demo Login (Admin)
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Register Form Component
const RegisterForm: React.FC<{
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'buyer' as 'buyer' | 'miner' | 'admin'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageBox, setMessageBox] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessageBox(null);
    setIsLoading(true);

    try {
      await apiCall('/users/register', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      setMessageBox({
        message: "Registration successful! You can now log in with your new account.",
        type: "success"
      });
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'buyer'
      });
      setTimeout(() => {
        onRegisterSuccess();
        setMessageBox(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join the Mining Marketplace</p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label">Account Type</label>
            <select
              className="form-input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'buyer' | 'miner' | 'admin' })}
            >
              <option value="buyer">Mineral Buyer</option>
              <option value="miner">Mineral Seller</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-success w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner w-5 h-5 mr-2"></div>
            ) : (
              <UserPlus className="w-5 h-5 mr-2" />
            )}
            Create Account
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
      {messageBox && (
        <MessageBox
          message={messageBox.message}
          type={messageBox.type}
          onClose={() => setMessageBox(null)}
        />
      )}
    </div>
  );
};

// Dashboard Component
const Dashboard: React.FC<{ user: User; setCurrentView: (view: any) => void }> = ({ user, setCurrentView }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome to your Mining Marketplace dashboard. What would you like to do today?
        </p>
      </div>

      {/* Stats Cards - These are mock, consider fetching real data later */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-xl p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Listings</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Offers</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">$11.8K</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setCurrentView('listings')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">View All Listings</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Browse available mineral listings from sellers worldwide.
          </p>
        </button>

        {(user.role === 'miner' || user.role === 'admin') && (
          <button
            onClick={() => setCurrentView('my-listings')}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">My Listings</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Manage your mineral listings and view offers.
            </p>
          </button>
        )}

        {(user.role === 'miner' || user.role === 'admin') && (
          <button
            onClick={() => setCurrentView("create-listing")}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Plus className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Create Listing</h3>
            </div>
            <p className="text-gray-600 mb-4">
              List your minerals for sale on the marketplace.
            </p>
          </button>
        )}

        {(user.role === 'buyer' || user.role === 'admin') && (
          <button
            onClick={() => setCurrentView('my-offers')}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">My Offers</h3>
            </div>
            <p className="text-gray-600 mb-4">
              View and manage offers you have made on listings.
            </p>
          </button>
        )}
      </div>

      {/* Account Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <User className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Account Type</p>
              <p className="font-medium text-gray-900 capitalize">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Email Status</p>
              <p className="font-medium text-green-600">{user.emailVerified ? 'Verified' : 'Unverified'}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Home className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-medium text-gray-900">{user.memberSince}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// All Listings Component
const AllListings: React.FC<{ listings: Listing[]; isLoading: boolean; error: string | null; handleViewListing: (id: number) => void }> = ({ listings, isLoading, error, handleViewListing }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.mineral_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === '' ||
                           listing.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Listings</h1>
        <p className="text-gray-600 mt-2">Browse available mineral listings from sellers worldwide</p>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Search Minerals</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Search by mineral type or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="form-label">Filter by Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listings...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error text-center py-12">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {!isLoading && !error && filteredListings.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
        </div>
      )}

      {!isLoading && !error && filteredListings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{listing.mineral_type}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  listing.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : listing.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </span>
              </div>

              <div className="flex items-center text-gray-600 mb-3">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">{listing.location}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-semibold text-gray-900">{listing.quantity.toLocaleString()} {listing.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price per {listing.unit}</p>
                  <p className="font-semibold text-gray-900">{listing.currency} {listing.price_per_unit}</p>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {listing.description}
              </p>

              <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                <span>Listed {new Date(listing.listed_date).toLocaleDateString()}</span>
                <span>ID: {listing.id}</span>
              </div>

              <button className="btn-primary w-full" onClick={() => handleViewListing(listing.id)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Listing Detail Component
const ListingDetail: React.FC<{
  listing: Listing;
  onBack: () => void;
  user: User;
  onMakeOfferSuccess?: () => void;
  onEditListing?: (listing: Listing) => void;
  onDeleteListing?: (listingId: number) => void;
  onViewOffersForListing?: (listingId: number) => void;
}> = ({ listing, onBack, user, onMakeOfferSuccess, onEditListing, onDeleteListing, onViewOffersForListing }) => {
  const totalValue = listing.quantity * listing.price_per_unit;
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerData, setOfferData] = useState({
    quantity: '',
    offerAmount: '',
    message: ''
  });
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerSuccess, setOfferSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfferError(null);
    setOfferSuccess(null);
    setIsSubmittingOffer(true);

    // Frontend validation for Stripe minimum amount
    const minAmount = { 'USD': 0.50, 'GBP': 0.30, 'EUR': 0.30 }[listing.currency.toUpperCase()] || 0.50;
    const proposedAmount = parseFloat(offerData.offerAmount);

    if (proposedAmount < minAmount) {
      setOfferError(`Offer amount must be at least ${listing.currency} ${minAmount.toFixed(2)} due1 to payment gateway minimums.`);
      setIsSubmittingOffer(false);
      return;
    }

    try {
      const payload = {
        listing_id: listing.id,
        offer_quantity: parseFloat(offerData.quantity),
        offer_price: proposedAmount, // Use validated amount
        message: offerData.message,
        currency: listing.currency || 'USD',
      };

      await apiCall("/marketplace/offers", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setOfferSuccess("Offer submitted successfully!");
      setOfferData({ quantity: '', offerAmount: '', message: '' });
      setShowOfferForm(false);

      if (onMakeOfferSuccess) {
        onMakeOfferSuccess();
      }
    } catch (err) {
      console.error("Error submitting offer:", err);
      setOfferError(err instanceof Error ? err.message : "Failed to submit offer");
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteListing) return;

    try {
      await apiCall(`/marketplace/listings/${listing.id}`, {
        method: "DELETE",
      });
      onDeleteListing(listing.id);
    } catch (err) {
      console.error(`Failed to delete listing: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const canMakeOffer = (user.role === 'buyer' || user.role === 'admin') && user.complianceStatus === 'compliant';
  const canEditListing = user.role === 'admin' || listing.seller_id === user.id;
  const canDeleteListing = user.role === 'admin' || listing.seller_id === user.id;
  const canViewOffers = user.role === 'admin' || listing.seller_id === user.id;


  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="btn-secondary"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Listings
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.mineral_type}</h1>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{listing.location}</span>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            listing.status === 'available'
              ? 'bg-green-100 text-green-800'
              : listing.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quantity & Pricing */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quantity & Pricing</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Available Quantity</span>
                <span className="font-semibold text-gray-900">{listing.quantity.toLocaleString()} {listing.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price per {listing.unit}</span>
                <span className="font-semibold text-gray-900">{listing.currency} {listing.price_per_unit}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <span className="text-gray-600">Total Value</span>
                <span className="text-xl font-bold text-blue-600">{listing.currency} {totalValue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Listing Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Listing Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Listing ID</span>
                <span className="font-semibold text-gray-900">#{listing.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Listed Date</span>
                <span className="font-semibold text-gray-900">{new Date(listing.listed_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-semibold text-gray-900">{new Date(listing.last_updated).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
          <p className="text-gray-600 leading-relaxed">{listing.description}</p>
        </div>

        {/* Compliance Warning for Buyer */}
        {user.role === 'buyer' && user.complianceStatus !== 'compliant' && (
          <div className="alert alert-warning mt-6">
            <ShieldQuestion className="w-5 h-5 mr-2" />
            Your account is currently **{(user.complianceStatus || 'unknown').replace('_', ' ')}**. You must be compliant to make offers. Please update your profile.
          </div>
        )}

        {/* Success/Error Messages */}
        {offerSuccess && (
          <div className="alert alert-success mt-6">
            {offerSuccess}
          </div>
        )}

        {offerError && (
          <div className="alert alert-error mt-6">
            {offerError}
          </div>
        )}

        {/* Make Offer Form */}
        {showOfferForm && canMakeOffer && (
          <div className="bg-gray-50 rounded-xl p-6 mt-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Make an Offer</h3>
            <form onSubmit={handleOfferSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Quantity ({listing.unit})</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder={`e.g., ${listing.quantity / 2}`}
                    value={offerData.quantity}
                    onChange={(e) => setOfferData({ ...offerData, quantity: e.target.value })}
                    required
                    min="1"
                    max={listing.quantity}
                    step="any"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max: {listing.quantity.toLocaleString()} {listing.unit}</p>
                </div>
                <div>
                  <label className="form-label">Total Offer Amount ({listing.currency})</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder={`e.g., ${listing.price_per_unit * (listing.quantity / 2)}`}
                    value={offerData.offerAmount}
                    onChange={(e) => setOfferData({ ...offerData, offerAmount: e.target.value })}
                    required
                    min="0"
                    step="any"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Message (Optional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Add a message to the seller..."
                  value={offerData.message}
                  onChange={(e) => setOfferData({ ...offerData, message: e.target.value })}
                ></textarea>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOfferForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isSubmittingOffer}
                >
                  {isSubmittingOffer ? (
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                  ) : (
                    <DollarSign className="w-4 h-4 mr-2" />
                  )}
                  Submit Offer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the listing for "{listing.mineral_type}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
          {canEditListing && (
            <button
              className="btn-secondary"
              onClick={() => onEditListing && onEditListing(listing)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Listing
            </button>
          )}

          {canMakeOffer && listing.status === 'available' && !showOfferForm && (
            <button
              onClick={() => setShowOfferForm(true)}
              className="btn-primary"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Make Offer
            </button>
          )}

          {canViewOffers && (
            <button
              className="btn-secondary"
              onClick={() => onViewOffersForListing && onViewOffersForListing(listing.id)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Offers
            </button>
          )}

          {canDeleteListing && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger ml-auto"
            >
              <X className="w-4 h-4 mr-2" />
              Delete Listing
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// My Offers Component
const MyOffers: React.FC<{ user: User; onProceedToPayment: (offer: Offer) => void }> = ({ user, onProceedToPayment }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setIsLoading(true);
        const data = await apiCall("/marketplace/offers/my-offers");
        setOffers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch offers");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOffers();
  }, [user.id]);

  const handleProceedToPaymentClick = (offer: Offer) => {
    // Only allow proceeding to payment if user is compliant
    if (user.complianceStatus === 'compliant') {
      onProceedToPayment(offer);
    } else {
      // Display a message if not compliant
      alert(`You must be compliant to proceed with payment. Your current status is: ${(user.complianceStatus || 'unknown').replace('_', ' ')}.`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Offers</h1>
        <p className="text-gray-600 mt-2">View offers you have made on listings</p>
      </div>

      {user.complianceStatus !== 'compliant' && (
        <div className="alert alert-warning">
          <ShieldQuestion className="w-5 h-5 mr-2" />
          Your account is currently **{(user.complianceStatus || 'unknown').replace('_', ' ')}**. You must be compliant to proceed with payments. Please update your profile.
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading offers...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error text-center py-12">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {!isLoading && !error && offers.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No offers found</h3>
          <p className="text-gray-600">You haven't made any offers yet.</p>
        </div>
      )}

      {!isLoading && !error && offers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Offer for Listing #{offer.listing_id}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  offer.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : offer.status === 'accepted'
                    ? 'bg-green-100 text-green-800'
                    : offer.status === 'rejected' || offer.status === 'expired'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Offer Amount</p>
                  <p className="font-semibold text-gray-900">{offer.currency} {offer.offer_price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-semibold text-gray-900">{offer.offer_quantity.toLocaleString()} kg</p>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {offer.message || 'No message provided.'}
              </p>

              <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                <span>Made on {new Date(offer.created_at).toLocaleDateString()}</span>
                <span>Offer ID: {offer.id}</span>
              </div>

              {offer.status === 'accepted' && (
                <button
                  onClick={() => handleProceedToPaymentClick(offer)}
                  className="btn-success w-full"
                  disabled={user.complianceStatus !== 'compliant'} // Disable if not compliant
                >
                  {actionLoading === offer.id ? (
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Mark as Completed
                </button>
              )}
              {offer.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')}
                    className="btn-primary flex-1"
                    disabled={actionLoading === offer.id}
                  >
                    {actionLoading === offer.id ? (
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Accept
                  </button>
                  <button
                    onClick={() => handleUpdateOfferStatus(offer.id, 'rejected')}
                    className="btn-danger flex-1"
                    disabled={actionLoading === offer.id}
                  >
                    {actionLoading === offer.id ? (
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {messageBox && (
        <MessageBox
          message={messageBox.message}
          type={messageBox.type}
          onClose={() => setMessageBox(null)}
        />
      )}
    </div>
  );
};


// Create Listing Form Component
const CreateListingForm: React.FC<{ user: User; onListingCreated: () => void; setCurrentView: (view: any) => void }> = ({ user, onListingCreated, setCurrentView }) => {
  const [formData, setFormData] = useState({
    mineralType: "",
    description: "",
    quantity: "",
    pricePerUnit: "",
    location: "",
    currency: "USD",
    unit: "kg"
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Frontend compliance check for sellers creating listings
    if (user.role === 'miner' && user.complianceStatus !== 'compliant') {
      setError(`You must be compliant to create a listing. Your current status is: ${(user.complianceStatus || 'unknown').replace('_', ' ')}.`); 
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        pricePerUnit: parseFloat(formData.pricePerUnit),
      };
      await apiCall("/marketplace/listings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuccessMessage("Listing created successfully!");
      setFormData({
        mineralType: "",
        description: "",
        quantity: "",
        pricePerUnit: "",
        location: "",
        currency: "USD",
        unit: "kg"
      });
      setTimeout(() => {
        onListingCreated();
        setCurrentView('my-listings');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Listing</h1>
        <p className="text-gray-600 mt-2">List your minerals for sale on the marketplace</p>
      </div>

      {user.role === 'miner' && user.complianceStatus !== 'compliant' && (
        <div className="alert alert-warning">
          <ShieldQuestion className="w-5 h-5 mr-2" />
          Your account is currently **{(user.complianceStatus || 'unknown').replace('_', ' ')}**. You must be compliant to create listings. Please update your profile.
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
        <div>
          <label className="form-label">Mineral Type</label>
          <input
            type="text"
            name="mineralType"
            className="form-input"
            placeholder="e.g., Gold Ore, Copper Concentrate"
            value={formData.mineralType}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="form-label">Description</label>
          <textarea
            name="description"
            className="form-input"
            rows={4}
            placeholder="Detailed description of the mineral, quality, etc."
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Quantity</label>
            <input
              type="number"
              name="quantity"
              className="form-input"
              placeholder="e.g., 1000"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="0"
              step="any"
            />
          </div>
          <div>
            <label className="form-label">Price per Unit</label>
            <input
              type="number"
              name="pricePerUnit"
              className="form-input"
              placeholder="e.g., 45.50"
              value={formData.pricePerUnit}
              onChange={handleChange}
              required
              min="0"
              step="any"
            />
          </div>
          <div>
            <label className="form-label">Currency</label>
            <select
              name="currency"
              className="form-input"
              value={formData.currency}
              onChange={handleChange}
              required
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Unit</label>
          <input
            type="text"
            name="unit"
            className="form-input"
            placeholder="e.g., kg, tons, grams"
            value={formData.unit}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="form-label">Location</label>
          <input
            type="text"
            name="location"
            className="form-input"
            placeholder="e.g., Nevada, USA"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading || (user.role === 'miner' && user.complianceStatus !== 'compliant')} // Disable if not compliant
          >
            {isLoading ? (
              <div className="loading-spinner w-5 h-5 mr-2"></div>
            ) : (
              <Plus className="w-5 h-5 mr-2" />
            )}
            Create Listing
          </button>
        </div>
      </form>
    </div>
  );
};


// My Listings Component
const MyListings: React.FC<{
  user: User;
  onEditListing?: (listing: Listing) => void;
  onHandleViewOffersForListing: (listingId: number) => void;
  setCurrentView: (view: any) => void;
  onDeleteListingSuccess: () => void;
  listings: Listing[];
  isLoading: boolean;
  error: string | null;
}> = ({ user, onEditListing, onHandleViewOffersForListing, setCurrentView, onDeleteListingSuccess, listings, isLoading, error }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [messageBox, setMessageBox] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const handleDeleteClick = (listing: Listing) => {
    setListingToDelete(listing);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!listingToDelete) return;

    try {
      await apiCall(`/marketplace/listings/${listingToDelete.id}`, {
        method: "DELETE",
      });
      setMessageBox({ message: "Listing deleted successfully!", type: "success" });
      setShowDeleteConfirm(false);
      setListingToDelete(null);
      onDeleteListingSuccess();
    } catch (err) {
      setMessageBox({ message: `Failed to delete listing: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" });
      setShowDeleteConfirm(false);
      setListingToDelete(null);
    }
  };

  const myListings = listings.filter((listing: Listing) => listing.seller_id === user.id);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-600 mt-2">Manage your mineral listings and view offers</p>
        </div>
        <button
          onClick={() => setCurrentView('create-listing')}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Listing
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your listings...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error text-center py-12">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {!isLoading && !error && myListings.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
          <p className="text-gray-600 mb-4">You haven't created any listings yet.</p>
          <button
            onClick={() => setCurrentView('create-listing')}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Listing
          </button>
        </div>
      )}

      {!isLoading && !error && myListings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{listing.mineral_type}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  listing.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : listing.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </span>
              </div>

              <div className="flex items-center text-gray-600 mb-3">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">{listing.location}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-semibold text-gray-900">{listing.quantity.toLocaleString()} {listing.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price per {listing.unit}</p>
                  <p className="font-semibold text-gray-900">{listing.currency} {listing.price_per_unit}</p>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {listing.description}
              </p>

              <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                <span>Listed {new Date(listing.listed_date).toLocaleDateString()}</span>
                <span>ID: {listing.id}</span>
              </div>

              <div className="flex gap-2">
                <button
                  className="btn-secondary flex-1"
                  onClick={() => onEditListing && onEditListing(listing)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onHandleViewOffersForListing) {
                      onHandleViewOffersForListing(listing.id);
                    } else {
                      console.error('MyListings: onHandleViewOffersForListing prop is UNDEFINED!');
                    }
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Offers
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteClick(listing)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {messageBox && (
        <MessageBox
          message={messageBox.message}
          type={messageBox.type}
          onClose={() => setMessageBox(null)}
        />
      )}
    </div>
  );
};

// Edit Listing Form Component
const EditListingForm: React.FC<{
  listing: Listing;
  user: User;
  onListingUpdated: () => void;
  onCancel: () => void;
}> = ({ listing, user, onListingUpdated, onCancel }) => {
  const [formData, setFormData] = useState({
    mineralType: listing.mineral_type,
    description: listing.description,
    quantity: listing.quantity.toString(),
    pricePerUnit: listing.price_per_unit.toString(),
    location: listing.location,
    status: listing.status,
    currency: listing.currency,
    unit: listing.unit
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Frontend compliance check for sellers editing listings
    if (user.role === 'miner' && user.complianceStatus !== 'compliant') {
      setError(`You must be compliant to edit a listing. Your current status is: ${(user.complianceStatus || 'unknown').replace('_', ' ')}.`); 
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        pricePerUnit: parseFloat(formData.pricePerUnit),
      };
      await apiCall(`/marketplace/listings/${listing.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSuccessMessage("Listing updated successfully!");
      setTimeout(() => {
        onListingUpdated();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update listing");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Listing</h1>
          <p className="text-gray-600 mt-2">Update your mineral listing details</p>
        </div>
        <button onClick={onCancel} className="btn-secondary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </button>
      </div>

      {user.role === 'miner' && user.complianceStatus !== 'compliant' && (
        <div className="alert alert-warning">
          <ShieldQuestion className="w-5 h-5 mr-2" />
          Your account is currently **{(user.complianceStatus || 'unknown').replace('_', ' ')}**. You must be compliant to edit listings. Please update your profile.
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
        <div>
          <label className="form-label">Mineral Type</label>
          <input
            type="text"
            name="mineralType"
            className="form-input"
            placeholder="e.g., Gold Ore, Copper Concentrate"
            value={formData.mineralType}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="form-label">Description</label>
          <textarea
            name="description"
            className="form-input"
            rows={4}
            placeholder="Detailed description of the mineral, quality, etc."
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Quantity ({formData.unit})</label>
            <input
              type="number"
              name="quantity"
              className="form-input"
              placeholder="e.g., 1000"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="0"
              step="any"
            />
          </div>
          <div>
            <label className="form-label">Price per Unit ({formData.currency})</label>
            <input
              type="number"
              name="pricePerUnit"
              className="form-input"
              placeholder="e.g., 45.50"
              value={formData.pricePerUnit}
              onChange={handleChange}
              required
              min="0"
              step="any"
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              name="status"
              className="form-input"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Unit</label>
          <input
            type="text"
            name="unit"
            className="form-input"
            placeholder="e.g., kg, tons, grams"
            value={formData.unit}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="form-label">Location</label>
          <input
            type="text"
            name="location"
            className="form-input"
            placeholder="e.g., Nevada, USA"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading || (user.role === 'miner' && user.complianceStatus !== 'compliant')} // Disable if not compliant
          >
            {isLoading ? (
              <div className="loading-spinner w-5 h-5 mr-2"></div>
            ) : (
              <Check className="w-5 h-5 mr-2" />
            )}
            Update Listing
          </button>
        </div>
      </form>
    </div>
  );
};


// Main App Component
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<"dashboard" | "listings" | "my-listings" | "my-offers" | "listing-detail" | "create-listing" | "edit-listing" | "offers-for-listing" | "payment-success" | "payment-cancel" | "my-profile" | "admin-users">("dashboard"); // Added "admin-users"
  const [isLoginView, setIsLoginView] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [offersChangedCounter, setOffersChangedCounter] = useState(0);
  const [messageBox, setMessageBox] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // NEW: State to track authentication loading

  // Centralized listings state
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);


  // Function to fetch all listings (called by App)
  const fetchAllListings = useCallback(async () => {
    try {
      setListingsLoading(true);
      const data = await apiCall("/marketplace/listings");
      setListings(data);
    } catch (err) {
      setListingsError(err instanceof Error ? err.message : "Failed to fetch all listings");
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadUserFromToken = async () => {
      setAuthLoading(true); // Set auth loading to true at the start
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams(window.location.search);
      if (params.get('transaction_id') && window.location.pathname.includes('/success')) {
        setCurrentView('payment-success');
        setAuthLoading(false); // Done loading for payment redirect
        return;
      }
      if (params.get('transaction_id') && window.location.pathname.includes('/cancel')) {
        setCurrentView('payment-cancel');
        setAuthLoading(false); // Done loading for payment redirect
        return;
      }

      if (token) {
        try {
          const fetchedUser = await apiCall('/users/profile');
          console.log("Frontend: Raw user data fetched on refresh/initial load:", fetchedUser); 

          const mappedUser: User = {
            id: fetchedUser.id,
            firstName: fetchedUser.firstName, 
            lastName: fetchedUser.lastName,   
            email: fetchedUser.email,
            role: fetchedUser.role,
            emailVerified: fetchedUser.emailVerified, 
            memberSince: fetchedUser.memberSince,     
            companyName: fetchedUser.companyName, 
            phoneNumber: fetchedUser.phoneNumber, 
            complianceStatus: fetchedUser.complianceStatus || 'pending', 
          };
          console.log("Frontend: Mapped user data after refresh/initial load:", mappedUser); 

          setUser(mappedUser);
          setCurrentView('dashboard');
          fetchAllListings();
        } catch (error) {
          console.error("Failed to fetch user profile with existing token:", error);
          localStorage.removeItem('authToken');
          setUser(null);
          setCurrentView('login');
        } finally {
          setAuthLoading(false); // Set auth loading to false when done
        }
      } else {
        setCurrentView('login');
        setAuthLoading(false); // Set auth loading to false if no token
      }
    };
    loadUserFromToken();
  }, [fetchAllListings]);


  const handleLogin = (userData: User) => {
    console.log("Frontend: User data received on successful login from backend (already mapped):", userData); 
    setUser(userData);
    setCurrentView('dashboard');
    fetchAllListings();
  };

  const handleRegisterSuccess = () => {
    setIsLoginView(true);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
    localStorage.removeItem('authToken');
    setListings([]);
    setSelectedListing(null);
    setEditingListing(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleViewListing = async (listingId: number) => {
    try {
      const foundListing = listings.find(l => l.id === listingId);
      if (foundListing) {
        setSelectedListing(foundListing);
        setCurrentView("listing-detail");
      } else {
        const data = await apiCall(`/marketplace/listings/${listingId}`);
        setSelectedListing(data);
        setCurrentView("listing-detail");
      }
    } catch (err) {
      setMessageBox({ message: `Failed to load listing: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" });
    }
  };

  const handleBackToListings = () => {
    setSelectedListing(null);
    setCurrentView('listings');
  };

  const handleEditListing = (listing: Listing) => {
    setEditingListing(listing);
    setCurrentView('edit-listing');
  };

  const handleListingUpdated = () => {
    setEditingListing(null);
    setCurrentView('my-listings');
    fetchAllListings();
  };

  const handleCancelEdit = () => {
    setEditingListing(null);
    setCurrentView('my-listings');
  };

  const handleListingCreated = () => {
    fetchAllListings();
  };

  const handleMakeOfferSuccess = () => {
    setOffersChangedCounter(prev => prev + 1);
  };

  const handleProceedToPayment = async (offer: Offer) => {
    if (!user) {
      setMessageBox({ message: "Please log in to proceed with payment.", type: "warning" });
      return;
    }
    // Frontend compliance check before initiating payment
    if (user.complianceStatus !== 'compliant') {
      setMessageBox({ message: `You must be compliant to proceed with payment. Your current status is: ${(user.complianceStatus || 'unknown').replace('_', ' ')}.`, type: "warning" });
      return;
    }

    try {
      const listing = listings.find(l => l.id === offer.listing_id);
      if (!listing) {
        throw new Error(`Listing with ID ${offer.listing_id} not found for payment.`);
      }

      const paymentPayload = {
        listing_id: offer.listing_id,
        offer_id: offer.id,
        seller_id: listing.seller_id,
        mineralType: listing.mineral_type,
        final_price: offer.offer_price,
        final_quantity: offer.offer_quantity,
        currency: listing.currency,
      };

      const paymentResponse = await apiCall('/payments', {
        method: "POST",
        body: JSON.stringify(paymentPayload),
      });

      if (paymentResponse.checkout_url) {
        window.location.href = paymentResponse.checkout_url;
      } else {
        setMessageBox({ message: "Failed to get Stripe checkout URL.", type: "error" });
      }
    } catch (err) {
      console.error("Error initiating payment:", err);
      setMessageBox({ message: `Failed to initiate payment: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" });
    }
  };

  const handleDeleteListingSuccess = () => {
    fetchAllListings();
    setCurrentView('my-listings');
  };

  const handleOfferStatusChange = () => {
    setOffersChangedCounter(prev => prev + 1);
  };

  const handleViewOffersForListing = (listingId: number) => {
    const foundListing = listings.find(l => l.id === listingId);
    if (foundListing) {
      setSelectedListing(foundListing);
      setCurrentView('offers-for-listing');
    } else {
      setMessageBox({ message: `Could not find listing with ID ${listingId} to view offers.`, type: "error" });
    }
  };

  const handleProfileUpdate = (updatedUserData: User) => {
    setUser(updatedUserData);
    setMessageBox({ message: "Profile updated successfully!", type: "success" });
    setCurrentView('dashboard');
  };

  // NEW: Function to handle compliance status update from AdminUsers component
  const handleUserComplianceStatusUpdate = (updatedUser: User) => {
    // If the updated user is the currently logged-in user, update their status in App state
    if (user && user.id === updatedUser.id) {
      setUser(updatedUser);
    }
    setMessageBox({ message: `User ${updatedUser.id}'s compliance status updated to ${updatedUser.complianceStatus}.`, type: "success" });
    // No need to change view, stay on admin-users
  };

  // NEW: Render a loading spinner while authentication is in progress
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="loading-spinner w-12 h-12 text-blue-600"></div>
        <p className="ml-4 text-gray-700">Loading application...</p>
      </div>
    );
  }

  // If not loading and no user, show login/register forms
  if (!user) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('transaction_id') && window.location.pathname.includes('/success')) {
      return <PaymentSuccessPage onBackToDashboard={() => { setCurrentView('dashboard'); window.history.replaceState({}, document.title, window.location.pathname); }} />;
    }
    if (params.get('transaction_id') && window.location.pathname.includes('/cancel')) {
      return <PaymentCancelPage onBackToDashboard={() => { setCurrentView('dashboard'); window.history.replaceState({}, document.title, window.location.pathname); }} />;
    }

    return isLoginView ? (
      <LoginForm
        onLogin={handleLogin}
        onSwitchToRegister={() => setIsLoginView(false)}
      />
    ) : (
      <RegisterForm
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={() => setIsLoginView(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center space-x-2 text-gray-900 hover:text-blue-600 transition-colors"
              >
                <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">Mining Marketplace</span>
              </button>

              <nav className="hidden md:flex space-x-6">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setCurrentView('listings')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'listings' || currentView === 'listing-detail'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>All Listings</span>
                </button>

                {(user.role === 'miner' || user.role === 'admin') && (
                  <button
                    onClick={() => setCurrentView('my-listings')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      currentView === 'my-listings' || currentView === 'edit-listing' || currentView === 'create-listing'
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>My Listings</span>
                  </button>
                )}

                {(user.role === 'buyer' || user.role === 'admin') && (
                  <button
                    onClick={() => setCurrentView('my-offers')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      currentView === 'my-offers'
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>My Offers</span>
                  </button>
                )}
                <button
                  onClick={() => setCurrentView('my-profile')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'my-profile'
                      ? 'bg-gray-200 text-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>My Profile</span>
                </button>
                {/* NEW: Admin Users Link */}
                {user.role === 'admin' && (
                  <button
                    onClick={() => setCurrentView('admin-users')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      currentView === 'admin-users'
                        ? 'bg-red-100 text-red-700' // Admin specific color
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Admin Users</span>
                  </button>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-600 capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && <Dashboard user={user} setCurrentView={setCurrentView} />}
        {currentView === 'listings' && <AllListings listings={listings} isLoading={listingsLoading} error={listingsError} handleViewListing={handleViewListing} />}
        {currentView === 'my-listings' && <MyListings user={user} onEditListing={handleEditListing} onHandleViewOffersForListing={handleViewOffersForListing} setCurrentView={setCurrentView} onDeleteListingSuccess={handleDeleteListingSuccess} listings={listings} isLoading={listingsLoading} error={listingsError} />}
        {currentView === 'my-offers' && <MyOffers user={user} onProceedToPayment={handleProceedToPayment} />}
        {currentView === 'listing-detail' && selectedListing && (
          <ListingDetail
            listing={selectedListing}
            onBack={handleBackToListings}
            user={user}
            onMakeOfferSuccess={handleMakeOfferSuccess}
            onEditListing={handleEditListing}
            onDeleteListing={handleDeleteListingSuccess}
            onViewOffersForListing={handleViewOffersForListing}
          />
        )}
        {currentView === "create-listing" && <CreateListingForm user={user} onListingCreated={handleListingCreated} setCurrentView={setCurrentView} />}
        {currentView === "edit-listing" && editingListing && (
          <EditListingForm
            listing={editingListing}
            user={user}
            onListingUpdated={handleListingUpdated}
            onCancel={handleCancelEdit}
          />
        )}
        {currentView === "offers-for-listing" && selectedListing && (
          <OffersForListing
            listingId={selectedListing.id}
            user={user}
            onBack={() => setCurrentView('listing-detail')}
            onOfferStatusChange={handleOfferStatusChange}
          />
        )}
        {currentView === "my-profile" && user && (
          <UserProfile
            user={user}
            onProfileUpdated={handleProfileUpdate}
            onBack={() => setCurrentView('dashboard')}
          />
        )}
        {/* NEW: Admin Users Component */}
        {currentView === "admin-users" && user.role === 'admin' && (
          <AdminUsers
            currentUser={user} // Pass the logged-in admin user
            onUserComplianceStatusUpdate={handleUserComplianceStatusUpdate}
            onBack={() => setCurrentView('dashboard')}
          />
        )}
      </main>
      {messageBox && (
        <MessageBox
          message={messageBox.message}
          type={messageBox.type}
          onClose={() => setMessageBox(null)}
        />
      )}
    </div>
  );
};

// --- NEW COMPONENTS FOR PAYMENT REDIRECTS ---

interface PaymentRedirectPageProps {
  onBackToDashboard: () => void;
}

const PaymentSuccessPage: React.FC<PaymentRedirectPageProps> = ({ onBackToDashboard }) => {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      const params = new URLSearchParams(window.location.search);
      const transactionId = params.get('transaction_id');

      if (transactionId) {
        try {
          setIsLoading(true);
          const data = await apiCall(`/payments/${transactionId}`);
          setTransaction(data);
        } catch (err) {
          console.error("Error fetching transaction details:", err);
          setError(err instanceof Error ? err.message : "Failed to load transaction details.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("No transaction ID found in URL.");
        setIsLoading(false);
      }
    };
    fetchTransactionDetails();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>

        {isLoading && (
          <div className="text-center py-4">
            <div className="loading-spinner w-6 h-6 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading transaction details...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error text-center py-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {transaction && (
          <div className="text-gray-700 space-y-2 mb-6">
            <p>Your payment for Listing **#{transaction.listing_id}** was successful.</p>
            <p className="font-semibold">Amount Paid: {transaction.currency} {transaction.final_price.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Transaction ID: {transaction.id}</p>
            <p className="text-sm text-gray-500">Status: {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</p>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          Thank you for your purchase! You will receive a confirmation shortly.
        </p>

        <button
          onClick={onBackToDashboard}
          className="btn-primary w-full"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

const PaymentCancelPage: React.FC<PaymentRedirectPageProps> = ({ onBackToDashboard }) => {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      const params = new URLSearchParams(window.location.search);
      const transactionId = params.get('transaction_id');

      if (transactionId) {
        try {
          setIsLoading(true);
          const data = await apiCall(`/payments/${transactionId}`);
          setTransaction(data);
        } catch (err) {
          console.error("Error fetching transaction details:", err);
          setError(err instanceof Error ? err.message : "Failed to load transaction details.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("No transaction ID found in URL.");
        setIsLoading(false);
      }
    };
    fetchTransactionDetails();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Canceled</h1>

        {isLoading && (
          <div className="text-center py-4">
            <div className="loading-spinner w-6 h-6 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading transaction details...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error text-center py-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {transaction && (
          <div className="text-gray-700 space-y-2 mb-6">
            <p>The payment for Listing **#{transaction.listing_id}** was canceled.</p>
            <p className="font-semibold">Amount: {transaction.currency} {transaction.final_price.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Transaction ID: {transaction.id}</p>
            <p className="text-sm text-gray-500">Status: {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</p>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          You can try again or return to your offers.
        </p>

        <button
          onClick={onBackToDashboard}
          className="btn-secondary w-full mb-3"
        >
          Back to Dashboard
        </button>
        <button
          onClick={() => window.history.back()}
          className="btn-primary w-full"
        >
          Try Payment Again
        </button>
      </div>
    </div>
  );
};

export default App;


// User Profile Component
interface UserProfileProps {
  user: User;
  onProfileUpdated: (updatedUser: User) => void;
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onProfileUpdated, onBack }) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await apiCall('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setSuccessMessage('Profile updated successfully!');
      onProfileUpdated(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const getComplianceStatusDisplay = (status: User['complianceStatus']) => {
    switch (status) {
      case 'compliant': return <span className="text-green-600 font-semibold flex items-center"><ShieldCheck className="w-5 h-5 mr-2" /> Compliant</span>;
      case 'pending': return <span className="text-orange-600 font-semibold flex items-center"><ShieldQuestion className="w-5 h-5 mr-2" /> Pending Review</span>;
      case 'non_compliant': return <span className="text-red-600 font-semibold flex items-center"><ShieldOff className="w-5 h-5 mr-2" /> Non-Compliant</span>;
      default: return <span className="text-gray-600">Unknown</span>;
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="btn-secondary">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">View and update your personal information.</p>
      </div>

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">User ID</p>
            <p className="font-semibold text-gray-900">{user.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Account Type</p>
            <p className="font-semibold text-gray-900 capitalize">{user.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email Verified</p>
            <p className={`font-semibold ${user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
              {user.emailVerified ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="font-semibold text-gray-900">{user.memberSince}</p>
          </div>
          {/* NEW: Compliance Status Display */}
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Compliance Status</p>
            {getComplianceStatusDisplay(user.complianceStatus)}
            {user.complianceStatus !== 'compliant' && (
              <p className="text-xs text-gray-500 mt-1">
                You must be compliant to fully participate in the marketplace (e.g., make/create payments).
              </p>
            )}
          </div>
        </div>

        <hr className="border-gray-200" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div>
            <label className="form-label">Email</label>
            <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="loading-spinner w-5 h-5 mr-2"></div>
            ) : (
              <Check className="w-5 h-5 mr-2" />
            )}
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
};

// NEW: AdminUsers Component for managing user compliance
interface AdminUsersProps {
  currentUser: User;
  onUserComplianceStatusUpdate: (updatedUser: User) => void;
  onBack: () => void;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ currentUser, onUserComplianceStatusUpdate, onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingUserId, setActionLoadingUserId] = useState<number | null>(null);
  const [messageBox, setMessageBox] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const fetchAllUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiCall('/users'); // Assuming an admin endpoint to get all users
      // Map BackendUser to Frontend User for display
      const mappedUsers: User[] = data.map((user: any) => ({
        id: user.id,
        firstName: user.firstName, 
        lastName: user.lastName,   
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified, 
        memberSince: user.memberSince,     
        companyName: user.companyName, 
        phoneNumber: user.phoneNumber, 
        complianceStatus: user.complianceStatus || 'pending', 
      }));
      setUsers(mappedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser.role === 'admin') {
      fetchAllUsers();
    } else {
      setError('Access Denied: Only administrators can view this page.');
      setIsLoading(false);
    }
  }, [currentUser.role, fetchAllUsers]);

  const handleStatusChange = async (userId: number, newStatus: User['complianceStatus']) => {
    setActionLoadingUserId(userId);
    try {
      const response = await apiCall(`/users/compliance/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      // Update the user in the local state
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? response.user : u));
      onUserComplianceStatusUpdate(response.user); // Notify App component if current user's status changed
      setMessageBox({ message: `User ${userId}'s status updated to ${newStatus}.`, type: "success" });
    } catch (err) {
      setMessageBox({ message: `Failed to update user status: ${err instanceof Error ? err.message : 'Unknown error'}.`, type: 'error' });
    } finally {
      setActionLoadingUserId(null);
    }
  };

  const getComplianceStatusDisplay = (status: User['complianceStatus']) => {
    switch (status) {
      case 'compliant': return <span className="text-green-600 font-semibold flex items-center"><ShieldCheck className="w-4 h-4 mr-1" /> Compliant</span>;
      case 'pending': return <span className="text-orange-600 font-semibold flex items-center"><ShieldQuestion className="w-4 h-4 mr-1" /> Pending</span>;
      case 'non_compliant': return <span className="text-red-600 font-semibold flex items-center"><ShieldOff className="w-4 h-4 mr-1" /> Non-Compliant</span>;
      default: return <span className="text-gray-600">Unknown</span>;
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="btn-secondary">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin: Manage Users</h1>
        <p className="text-gray-600 mt-2">Review and update user compliance statuses.</p>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error text-center py-12">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {!isLoading && !error && users.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found.</h3>
        </div>
      )}

      {!isLoading && !error && users.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliance Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((userItem) => (
                <tr key={userItem.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {userItem.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {userItem.firstName} {userItem.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {userItem.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {userItem.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getComplianceStatusDisplay(userItem.complianceStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* Prevent admin from changing their own compliance status via this table */}
                    {userItem.id !== currentUser.id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusChange(userItem.id, 'compliant')}
                          className="btn-sm btn-success"
                          disabled={actionLoadingUserId === userItem.id || userItem.complianceStatus === 'compliant'}
                        >
                          {actionLoadingUserId === userItem.id ? 'Updating...' : 'Set Compliant'}
                        </button>
                        <button
                          onClick={() => handleStatusChange(userItem.id, 'pending')}
                          className="btn-sm btn-warning"
                          disabled={actionLoadingUserId === userItem.id || userItem.complianceStatus === 'pending'}
                        >
                          {actionLoadingUserId === userItem.id ? 'Updating...' : 'Set Pending'}
                        </button>
                        <button
                          onClick={() => handleStatusChange(userItem.id, 'non_compliant')}
                          className="btn-sm btn-danger"
                          disabled={actionLoadingUserId === userItem.id || userItem.complianceStatus === 'non_compliant'}
                        >
                          {actionLoadingUserId === userItem.id ? 'Updating...' : 'Set Non-Compliant'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}\
            </tbody>
          </table>
        </div>
      )}
      {messageBox && (
        <MessageBox
          message={messageBox.message}
          type={messageBox.type}
          onClose={() => setMessageBox(null)}
        />
      )}
    </div>
  );
};
