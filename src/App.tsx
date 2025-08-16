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
  ShieldQuestion, // For pending status
  EyeOff // For hide password
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
  companyName?: string; // NEW: Company Name
  phoneNumber?: string; // Existing, but ensure it's handled
  location?: string; // NEW: User's location
  complianceStatus: 'pending' | 'compliant' | 'non_compliant'; 
  // NEW: Buyer-specific requirements
  preferredMineralTypes?: string[];
  minimumPurchaseQuantity?: number;
  requiredRegulations?: string[];
}

interface Listing {
  id: number;
  seller_id: number;
  seller_company_name?: string;
  seller_location?: string;
  seller_compliance_status?: 'pending' | 'compliant' | 'non_compliant';
  mineral_type: string;
  description: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  currency: string;
  location: string;
  status: 'available' | 'pending' | 'sold' | 'canceled';
  created_at: string;
  updated_at: string;
}

interface Offer {
  id: number;
  listing_id: number;
  buyer_id: number;
  buyer_company_name?: string; // Joined from users table
  listing_mineral_type?: string; // Joined from listings table
  listing_price?: number; // Joined from listings table
  offered_price: number;
  quantity_offered: number;
  offer_status: 'pending' | 'accepted' | 'rejected' | 'canceled';
  created_at: string;
}

// Global state and utility functions
const API_BASE_URL = 'https://mining-marketplace-backend-29u8.onrender.com/api';

const getAuthToken = () => localStorage.getItem('authToken');

// The main API call utility function
const apiCall = async (
  endpoint: string,
  method: string,
  data: any = null,
  isAuthenticated = true
) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (isAuthenticated && token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`apiCall: Sending token for ${endpoint}`);
  } else if (isAuthenticated && !token) {
    console.log(`apiCall: No token found for ${endpoint}`);
  }

  const config: RequestInit = {
    method: method,
    headers: headers,
    body: data ? JSON.stringify(data) : undefined,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      console.log(`apiCall Error for ${endpoint}: HTTP ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') !== -1) {
      return await response.json();
    } else {
      return {};
    }
  } catch (error) {
    console.log(`apiCall Error for ${endpoint}:`, error);
    throw error;
  }
};

interface MessageBoxProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const MessageBox: React.FC<MessageBoxProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const typeClasses = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${typeClasses[type]}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{message}</span>
        <button onClick={() => { setIsVisible(false); onClose(); }} className="ml-4">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface LoginFormProps {
  onLoginSuccess: (token: string) => void;
  onViewChange: (view: 'login' | 'register') => void;
  setMessageBox: (box: { message: string; type: 'success' | 'error' | 'info' } | null) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onViewChange, setMessageBox }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Corrected to use the proper auth endpoint
      const response = await apiCall('/auth/login', 'POST', { email, password }, false);
      if (response && response.token) {
        onLoginSuccess(response.token);
      } else {
        setMessageBox({ message: 'Login failed. Please check your credentials.', type: 'error' });
      }
    } catch (error) {
      setMessageBox({ message: 'Login failed. Please try again.', type: 'error' });
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex justify-center mb-6">
          <LogIn className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="password">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
            disabled={loading}
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Don't have an account?{' '}
          <button
            onClick={() => onViewChange('register')}
            className="text-blue-600 font-semibold hover:underline"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

interface RegisterFormProps {
  onRegisterSuccess: (token: string) => void;
  onViewChange: (view: 'login' | 'register') => void;
  setMessageBox: (box: { message: string; type: 'success' | 'error' | 'info' } | null) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess, onViewChange, setMessageBox }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'buyer' | 'miner'>('buyer');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const userData = { email, password, firstName, lastName, role, companyName, phoneNumber, location };ompanyName, phoneNumber };
    try {
      // Corrected endpoint from /users/register to /auth/register
      const response = await apiCall('/auth/register', 'POST', userData, false);
      if (response && response.token) {
        setMessageBox({ message: 'Registration successful!', type: 'success' });
        onRegisterSuccess(response.token);
      } else {
        setMessageBox({ message: 'Registration failed. Please try again.', type: 'error' });
      }
    } catch (error) {
      setMessageBox({ message: 'Registration failed: ' + (error as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex justify-center mb-6">
          <UserPlus className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Create an Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="w-1/2">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="password">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Role</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="buyer"
                  checked={role === 'buyer'}
                  onChange={() => setRole('buyer')}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-gray-700">Buyer</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="miner"
                  checked={role === 'miner'}
                  onChange={() => setRole('miner')}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-gray-700">Miner</span>
              </label>
            </div>
          </div>


          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="phoneNumber">Phone Number (Optional)</label>
            <input
              type="text"
              id="phoneNumber"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="location">Location (e.g., City, Country)</label>
            <input
              type="text"
              id="location"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <button
            onClick={() => onViewChange('login')}
            className="text-blue-600 font-semibold hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};


// Main App Component
const App: React.FC = () => {
  // State for authentication and user data
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // State for view management
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'dashboard' | 'listings' | 'listing-detail' | 'my-listings' | 'create-listing' | 'edit-listing' | 'my-offers' | 'admin-dashboard' | 'user-profile' | 'all-users'>('login');
  
  // State for dynamic content
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // State for modals and messages
  const [messageBox, setMessageBox] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // State for editing a listing
  const [listingToEdit, setListingToEdit] = useState<Listing | null>(null);
  const [offersForListing, setOffersForListing] = useState<Offer[]>([]);
  const [actionLoadingUserId, setActionLoadingUserId] = useState<number | null>(null);


  // Memoized callback functions to avoid re-creation
  const loadUserFromToken = useCallback(async (token: string) => {
    try {
      const userData = await apiCall('/users/profile', 'GET');
      console.log('Frontend: Raw user data fetched on refresh/initial load:', userData);
      
      const mappedUser: User = {
        id: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        role: userData.role,
        emailVerified: userData.email_verified,
        memberSince: userData.member_since,
        companyName: userData.company_name,
        phoneNumber: userData.phone_number,
        location: userData.location,
        complianceStatus: userData.compliance_status
      };
      console.log('Frontend: Mapped user data after refresh/initial load:', mappedUser);
      
      setCurrentUser(mappedUser);
      setIsLoggedIn(true);
      // Determine the initial view based on role
      if (mappedUser.role === 'admin') {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('listings');
      }
    } catch (error) {
      console.log('Frontend: Failed to fetch user profile with existing token. Clearing token. ');
      localStorage.removeItem('authToken');
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCurrentView('login');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleAuthSuccess = (token: string) => {
    localStorage.setItem('authToken', token);
    loadUserFromToken(token);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentView('login');
    setMessageBox({ message: 'You have been logged out successfully.', type: 'info' });
  };
  
  const handleNavClick = (view: typeof currentView, data: any = null) => {
    setCurrentView(view);
    // Logic to set selected items based on navigation
    if (view === 'listing-detail' && data) {
      setSelectedListingId(data.id);
      setSelectedListing(data);
    } else if (view === 'edit-listing' && data) {
      setListingToEdit(data);
    } else {
      setSelectedListingId(null);
      setSelectedListing(null);
      setListingToEdit(null);
    }
  };

  const fetchListings = useCallback(async () => {
    try {
      const data = await apiCall('/marketplace/listings', 'GET', null, false);
      if (Array.isArray(data)) {
        setListings(data);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  }, []);
  
  const fetchMyListings = useCallback(async () => {
    if (!isLoggedIn || (currentUser?.role !== 'miner' && currentUser?.role !== 'admin')) return;
    try {
      const data = await apiCall('/marketplace/my-listings/seller', 'GET');
      if (Array.isArray(data)) {
        setListings(data);
      }
    } catch (error) {
      console.error('Failed to fetch my listings:', error);
    }
  }, [isLoggedIn, currentUser]);
  
  const fetchMyOffers = useCallback(async () => {
    if (!isLoggedIn || currentUser?.role !== 'buyer') return;
    try {
      const data = await apiCall('/marketplace/offers/my-offers', 'GET');
      if (Array.isArray(data)) {
        setMyOffers(data);
      }
    } catch (error) {
      console.error('Failed to fetch my offers:', error);
    }
  }, [isLoggedIn, currentUser]);

  const fetchAllUsers = useCallback(async () => {
    if (!isLoggedIn || currentUser?.role !== 'admin') return;
    try {
      const data = await apiCall('/users', 'GET');
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [isLoggedIn, currentUser]);

  const fetchOffersForListing = useCallback(async (listingId: number) => {
    if (!isLoggedIn) return;
    try {
      const data = await apiCall(`/marketplace/offers/listing/${listingId}`, 'GET');
      if (Array.isArray(data)) {
        setOffersForListing(data);
      }
    } catch (error) {
      console.error('Failed to fetch offers for listing:', error);
    }
  }, [isLoggedIn]);

  // Main Effect Hook
  useEffect(() => {
    // Check for a token on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('transaction_id');
    const sessionId = urlParams.get('session_id');

    console.log('App.tsx useEffect (Auth): Initial path:', window.location.pathname);
    console.log('App.tsx useEffect (Auth): Transaction ID param:', transactionId);
    console.log('App.tsx useEffect (Auth): Session ID param:', sessionId);

    const token = localStorage.getItem('authToken');
    console.log('App.tsx useEffect (Auth): Current authToken in localStorage:', token ? 'Present' : 'Absent');
    
    if (token) {
      loadUserFromToken(token);
    } else {
      console.log('App.tsx useEffect (Auth): No token found in localStorage. Setting view to login.');
      setIsLoggedIn(false);
      setCurrentUser(null);
      setAuthLoading(false);
      setCurrentView('login');
    }
  }, [loadUserFromToken]);


  // Secondary effect for data fetching based on view and user status
  useEffect(() => {
    if (!authLoading) {
      if (isLoggedIn) {
        if (currentView === 'listings') {
          fetchListings();
        } else if (currentView === 'my-listings') {
          fetchMyListings();
        } else if (currentView === 'my-offers') {
          fetchMyOffers();
        } else if (currentView === 'all-users') {
          fetchAllUsers();
        }
      }
    }
  }, [currentView, isLoggedIn, authLoading, fetchListings, fetchMyListings, fetchMyOffers, fetchAllUsers]);

  // Handle data fetching for listing details and offers
  useEffect(() => {
    if (currentView === 'listing-detail' && selectedListingId) {
      fetchOffersForListing(selectedListingId);
    }
  }, [currentView, selectedListingId, fetchOffersForListing]);

  
  // Component rendering
  if (authLoading) {
    console.log('App.tsx Render: authLoading is true. Displaying spinner.');
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  console.log('App.tsx Render: Current Path:', window.location.pathname);
  console.log('App.tsx Render: Transaction ID in URL:', new URLSearchParams(window.location.search).get('transaction_id'));
  console.log('App.tsx Render: Session ID in URL:', new URLSearchParams(window.location.search).get('session_id'));
  console.log('App.tsx Render: currentView state:', currentView);

  if (!isLoggedIn) {
    console.log('App.tsx Render: Default path and user not logged in. Rendering Login/Register.');
    return (
      <>
        {currentView === 'login' ? (
          <LoginForm
            onLoginSuccess={handleAuthSuccess}
            onViewChange={setCurrentView}
            setMessageBox={setMessageBox}
          />
        ) : (
          <RegisterForm
            onRegisterSuccess={handleAuthSuccess}
            onViewChange={setCurrentView}
            setMessageBox={setMessageBox}
          />
        )}
        {messageBox && (
          <MessageBox
            message={messageBox.message}
            type={messageBox.type}
            onClose={() => setMessageBox(null)}
          />
        )}
      </>
    );
  }

  // Define components to render based on the current view and user role
  const renderView = () => {
    // Admin Views
    if (currentUser?.role === 'admin') {
      switch (currentView) {
        case 'admin-dashboard':
          return <AdminDashboard onNavClick={handleNavClick} currentUser={currentUser} setMessageBox={setMessageBox} />;
        case 'all-users':
          return <AllUsers users={users} setUsers={setUsers} setMessageBox={setMessageBox} />;
        default:
          return <AdminDashboard onNavClick={handleNavClick} currentUser={currentUser} setMessageBox={setMessageBox} />;
      }
    }

    // Miner & Buyer Views
    switch (currentView) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} onNavClick={handleNavClick} />;
      case 'listings':
        return <AllListings listings={listings} onNavClick={handleNavClick} currentUser={currentUser} />;
      case 'listing-detail':
        return <ListingDetail listing={selectedListing} onNavClick={handleNavClick} currentUser={currentUser} fetchOffersForListing={fetchOffersForListing} offersForListing={offersForListing} setMessageBox={setMessageBox} />;
      case 'my-listings':
        return <MyListings listings={listings} onNavClick={handleNavClick} currentUser={currentUser} fetchMyListings={fetchMyListings} setMessageBox={setMessageBox} />;
      case 'create-listing':
        return <CreateListing onNavClick={handleNavClick} setMessageBox={setMessageBox} />;
      case 'edit-listing':
        return <EditListing listing={listingToEdit} onNavClick={handleNavClick} setMessageBox={setMessageBox} />;
      case 'my-offers':
        return <MyOffers offers={myOffers} onNavClick={handleNavClick} />;
      default:
        // Default to a dashboard view if logged in but view state is unexpected
        return <Dashboard currentUser={currentUser} onNavClick={handleNavClick} />;
    }
  };

  console.log('App.tsx Render: Default path and user logged in. Rendering main app views based on currentView state.');
  
  return (
    <div className="bg-gray-100 min-h-screen text-gray-800 font-sans antialiased">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavClick={handleNavClick} />
      <main className="container mx-auto py-8 px-4">
        {renderView()}
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

// ... (other components like Header, Dashboard, etc. would go here)

const Header: React.FC<{ currentUser: User | null; onLogout: () => void; onNavClick: (view: any, data?: any) => void; }> = ({ currentUser, onLogout, onNavClick }) => {
  return (
    <header className="bg-white shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavClick('dashboard')} className="flex items-center space-x-2 text-gray-800 font-bold text-xl hover:text-blue-600 transition-colors">
            <ShoppingBag className="w-6 h-6" />
            <span>Marketplace</span>
          </button>
          {currentUser && (
            <nav>
              <ul className="flex space-x-4 ml-6">
                <li>
                  <button onClick={() => onNavClick('dashboard')} className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                    <Home className="w-5 h-5 mr-1" /> Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavClick('listings')} className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                    <Search className="w-5 h-5 mr-1" /> Listings
                  </button>
                </li>
                {currentUser.role === 'miner' && (
                  <>
                    <li>
                      <button onClick={() => onNavClick('my-listings')} className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                        <Package className="w-5 h-5 mr-1" /> My Listings
                      </button>
                    </li>
                    <li>
                      <button onClick={() => onNavClick('create-listing')} className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                        <Plus className="w-5 h-5 mr-1" /> Create Listing
                      </button>
                    </li>
                  </>
                )}
                {currentUser.role === 'buyer' && (
                  <li>
                    <button onClick={() => onNavClick('my-offers')} className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                      <TrendingUp className="w-5 h-5 mr-1" /> My Offers
                    </button>
                  </li>
                )}
                {currentUser.role === 'admin' && (
                  <li>
                    <button onClick={() => onNavClick('admin-dashboard')} className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                      <Users className="w-5 h-5 mr-1" /> Admin Dashboard
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {currentUser && (
            <>
              <span className="text-gray-700 hidden sm:block">
                Hello, {currentUser.firstName} ({currentUser.role})
              </span>
              <button onClick={onLogout} className="flex items-center text-gray-600 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5 mr-1" /> Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};


const Dashboard: React.FC<{ currentUser: User | null; onNavClick: (view: any, data?: any) => void; }> = ({ currentUser, onNavClick }) => {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center">Dashboard</h1>
      {currentUser?.role === 'miner' && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Miner Dashboard</h2>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <button onClick={() => onNavClick('my-listings')} className="btn-primary w-full md:w-auto">
              View My Listings
            </button>
            <button onClick={() => onNavClick('create-listing')} className="btn-secondary w-full md:w-auto">
              Create New Listing
            </button>
          </div>
        </div>
      )}
      {currentUser?.role === 'buyer' && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Buyer Dashboard</h2>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <button onClick={() => onNavClick('listings')} className="btn-primary w-full md:w-auto">
              Browse Listings
            </button>
            <button onClick={() => onNavClick('my-offers')} className="btn-secondary w-full md:w-auto">
              View My Offers
            </button>
          </div>
        </div>
      )}
      {currentUser?.role === 'admin' && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <button onClick={() => onNavClick('all-users')} className="btn-primary w-full md:w-auto">
              Manage Users
            </button>
            <button onClick={() => onNavClick('listings')} className="btn-secondary w-full md:w-auto">
              View All Listings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AllListings: React.FC<{ listings: Listing[]; onNavClick: (view: any, data?: any) => void; currentUser: User | null; }> = ({ listings, onNavClick, currentUser }) => {
  console.log('AllListings Component: received listings prop:', listings);
  
  const filteredListings = currentUser?.role === 'miner' 
    ? listings.filter(l => l.seller_id !== currentUser.id)
    : listings;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center">All Mineral Listings</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">No listings found.</p>
        ) : (
          filteredListings.map(listing => (
            <div key={listing.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4 transition-transform transform hover:scale-105">
              <h2 className="text-2xl font-bold text-gray-900">{listing.mineral_type}</h2>
              <p className="text-gray-600 line-clamp-3">{listing.description}</p>
              <div className="flex items-center text-gray-700">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                <span className="font-semibold text-lg">
                  {listing.price_per_unit} {listing.currency} / {listing.unit}
                </span>
              </div>
              <div className="flex items-center text-gray-500">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{listing.location}</span>
              </div>
              <p className="text-sm text-gray-500">Seller: {listing.seller_company_name}</p>
              <button
                onClick={() => onNavClick('listing-detail', listing)}
                className="btn-primary w-full"
              >
                View Details
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MyListings: React.FC<{ listings: Listing[]; onNavClick: (view: any, data?: any) => void; currentUser: User | null; fetchMyListings: () => Promise<void>; setMessageBox: (box: { message: string; type: 'success' | 'error' | 'info' } | null) => void; }> = ({ listings, onNavClick, currentUser, fetchMyListings, setMessageBox }) => {
  const handleDelete = async (listingId: number) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await apiCall(`/marketplace/listings/${listingId}`, 'DELETE');
      setMessageBox({ message: 'Listing deleted successfully!', type: 'success' });
      fetchMyListings(); // Refresh the list
    } catch (error) {
      setMessageBox({ message: 'Failed to delete listing.', type: 'error' });
      console.error('Delete listing failed:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">My Listings</h1>
        <button onClick={() => onNavClick('create-listing')} className="btn-secondary flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Create New
        </button>
      </div>
      {listings.length === 0 ? (
        <p className="text-center text-gray-500">You have no active listings.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <div key={listing.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
              <h2 className="text-xl font-bold">{listing.mineral_type}</h2>
              <p className="text-gray-600">{listing.description}</p>
              <div className="flex items-center text-gray-700">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                <span className="font-semibold">{listing.price_per_unit} {listing.currency} / {listing.unit}</span>
              </div>
              <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                listing.status === 'available' ? 'bg-green-100 text-green-800' :
                listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>{listing.status}</span>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => onNavClick('listing-detail', listing)}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  <Eye className="w-4 h-4 mr-2" /> View
                </button>
                <button
                  onClick={() => onNavClick('edit-listing', listing)}
                  className="btn-info flex-1 flex items-center justify-center"
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(listing.id)}
                  className="btn-danger flex-1 flex items-center justify-center"
                >
                  <X className="w-4 h-4 mr-2" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateListing: React.FC<{ onNavClick: (view: any, data?: any) => void; setMessageBox: (box: { message: string; type: 'success' | 'error' | 'info' } | null) => void; }> = ({ onNavClick, setMessageBox }) => {
  const [formData, setFormData] = useState({
    mineral_type: '',
    description: '',
    quantity: 0,
    unit: '',
    price_per_unit: 0,
    currency: '',
    location: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'quantity' || name === 'price_per_unit') ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall('/marketplace/listings', 'POST', formData);
      setMessageBox({ message: 'Listing created successfully!', type: 'success' });
      onNavClick('my-listings');
    } catch (error) {
      setMessageBox({ message: 'Failed to create listing.', type: 'error' });
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center">Create New Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="mineral_type">Mineral Type</label>
          <input type="text" id="mineral_type" name="mineral_type" value={formData.mineral_type} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="description">Description</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="quantity">Quantity</label>
            <input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="unit">Unit</label>
            <input type="text" id="unit" name="unit" value={formData.unit} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="price_per_unit">Price Per Unit</label>
            <input type="number" id="price_per_unit" name="price_per_unit" value={formData.price_per_unit} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="currency">Currency</label>
            <input type="text" id="currency" name="currency" value={formData.currency} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="location">Location</label>
          <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => onNavClick('my-listings')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">Create Listing</button>
        </div>
      </form>
    </div>
  );
};

const EditListing: React.FC<{ listing: Listing | null; onNavClick: (view: any, data?: any) => void; setMessageBox: (box: { message: string; type: 'success' | 'error' | 'info' } | null) => void; }> = ({ listing, onNavClick, setMessageBox }) => {
  const [formData, setFormData] = useState({
    mineral_type: listing?.mineral_type || '',
    description: listing?.description || '',
    quantity: listing?.quantity || 0,
    unit: listing?.unit || '',
    price_per_unit: listing?.price_per_unit || 0,
    currency: listing?.currency || '',
    location: listing?.location || '',
    status: listing?.status || 'available',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'quantity' || name === 'price_per_unit') ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing?.id) {
      setMessageBox({ message: 'Listing ID not found for update.', type: 'error' });
      return;
    }
    try {
      await apiCall(`/marketplace/listings/${listing.id}`, 'PUT', formData);
      setMessageBox({ message: 'Listing updated successfully!', type: 'success' });
      onNavClick('my-listings');
    } catch (error) {
      setMessageBox({ message: 'Failed to update listing.', type: 'error' });
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center">Edit Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="mineral_type">Mineral Type</label>
          <input type="text" id="mineral_type" name="mineral_type" value={formData.mineral_type} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="description">Description</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="quantity">Quantity</label>
            <input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="unit">Unit</label>
            <input type="text" id="unit" name="unit" value={formData.unit} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="price_per_unit">Price Per Unit</label>
            <input type="number" id="price_per_unit" name="price_per_unit" value={formData.price_per_unit} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="currency">Currency</label>
            <input type="text" id="currency" name="currency" value={formData.currency} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="location">Location</label>
          <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="status">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg">
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => onNavClick('my-listings')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

const MyOffers: React.FC<{ offers: Offer[]; onNavClick: (view: any, data?: any) => void; }> = ({ offers, onNavClick }) => {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center">My Offers</h1>
      {offers.length === 0 ? (
        <p className="text-center text-gray-500">You have not made any offers yet.</p>
      ) : (
        <div className="space-y-4">
          {offers.map(offer => (
            <div key={offer.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">{offer.listing_mineral_type || 'Mineral'}</h2>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  offer.offer_status === 'accepted' ? 'bg-green-100 text-green-800' :
                  offer.offer_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>{offer.offer_status}</span>
              </div>
              <p className="text-gray-600 mb-2">Offered Price: ${offer.offered_price}</p>
              <p className="text-gray-600">Quantity: {offer.quantity_offered}</p>
              <button onClick={() => onNavClick('listing-detail', { id: offer.listing_id })} className="mt-4 btn-primary">
                View Listing
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ListingDetail: React.FC<{ listing: Listing | null; onNavClick: (view: any, data?: any) => void; currentUser: User | null; fetchOffersForListing: (id: number) => Promise<void>; offersForListing: Offer[]; setMessageBox: (box: { message: string; type: 'success' | 'error' | 'info' } | null) => void; }> = ({ listing, onNavClick, currentUser, fetchOffersForListing, offersForListing, setMessageBox }) => {
  const [offerPrice, setOfferPrice] = useState(0);
  const [offerQuantity, setOfferQuantity] = useState(0);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    try {
      await apiCall(`/marketplace/offers`, 'POST', {
        listing_id: listing.id,
        offered_price: offerPrice,
        quantity_offered: offerQuantity
      });
      setMessageBox({ message: 'Offer created successfully!', type: 'success' });
      // Refresh offers if the current user is the seller
      if (currentUser?.role !== 'buyer') {
         fetchOffersForListing(listing.id);
      }
    } catch (error) {
      setMessageBox({ message: 'Failed to create offer.', type: 'error' });
    }
  };

  const handleUpdateOfferStatus = async (offerId: number, status: 'accepted' | 'rejected') => {
    try {
      await apiCall(`/marketplace/offers/${offerId}/status`, 'PUT', { status });
      setMessageBox({ message: `Offer ${status} successfully!`, type: 'success' });
      // Refresh offers
      if (listing) {
        fetchOffersForListing(listing.id);
      }
    } catch (error) {
      setMessageBox({ message: 'Failed to update offer status.', type: 'error' });
    }
  };

  if (!listing) {
    return <div className="text-center text-gray-500">Listing not found.</div>;
  }
  
  const isSeller = currentUser?.id === listing.seller_id;
  const isAdmin = currentUser?.role === 'admin';
  const isBuyer = currentUser?.role === 'buyer';

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <button onClick={() => isSeller || isAdmin ? onNavClick('my-listings') : onNavClick('listings')} className="flex items-center text-blue-600 mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <h1 className="text-4xl font-bold mb-4">{listing.mineral_type}</h1>
        <p className="text-gray-600 text-lg mb-4">{listing.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            <span className="font-semibold text-xl">
              {listing.price_per_unit} {listing.currency} / {listing.unit}
            </span>
          </div>
          <div className="flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-600" />
            <span className="font-semibold text-lg">{listing.quantity} {listing.unit} available</span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-red-600" />
            <span className="text-lg">{listing.location}</span>
          </div>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-xl font-semibold mb-2">Seller Information</h3>
          <p className="text-gray-700">Company: {listing.seller_company_name || 'N/A'}</p>
          <p className="text-gray-700 flex items-center">
            Compliance Status:
            <span className={`ml-2 px-2 py-1 text-sm font-semibold rounded-full flex items-center ${
              listing.seller_compliance_status === 'compliant' ? 'bg-green-100 text-green-800' :
              listing.seller_compliance_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {listing.seller_compliance_status === 'compliant' && <CheckCircle className="w-4 h-4 mr-1" />}
              {listing.seller_compliance_status === 'pending' && <ShieldQuestion className="w-4 h-4 mr-1" />}
              {listing.seller_compliance_status === 'non_compliant' && <ShieldOff className="w-4 h-4 mr-1" />}
              {listing.seller_compliance_status || 'N/A'}
            </span>
          </p>
        </div>
      </div>
      
      {isSeller && (
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 mt-8">
          <h2 className="text-2xl font-bold mb-4">Offers for this Listing</h2>
          {offersForListing.length === 0 ? (
            <p className="text-gray-500">No offers have been made for this listing yet.</p>
          ) : (
            <div className="space-y-4">
              {offersForListing.map(offer => (
                <div key={offer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="font-semibold text-lg">{offer.buyer_company_name || `Buyer #${offer.buyer_id}`}</p>
                    <p className="text-gray-600">Offered: ${offer.offered_price} for {offer.quantity_offered} {listing.unit}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      offer.offer_status === 'accepted' ? 'bg-green-100 text-green-800' :
                      offer.offer_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {offer.offer_status}
                    </span>
                    {offer.offer_status === 'pending' && (
                      <>
                        <button onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')} className="btn-sm btn-success">Accept</button>
                        <button onClick={() => handleUpdateOfferStatus(offer.id, 'rejected')} className="btn-sm btn-danger">Reject</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isBuyer && (
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 mt-8">
          <h2 className="text-2xl font-bold mb-4">Make an Offer</h2>
          <form onSubmit={handleCreateOffer} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2" htmlFor="offerPrice">Your Offered Price</label>
              <input
                type="number"
                id="offerPrice"
                value={offerPrice}
                onChange={(e) => setOfferPrice(parseFloat(e.target.value))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                min="0"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2" htmlFor="offerQuantity">Quantity</label>
              <input
                type="number"
                id="offerQuantity"
                value={offerQuantity}
                onChange={(e) => setOfferQuantity(parseFloat(e.target.value))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                min="1"
                max={listing.quantity}
              />
            </div>
            <button type="submit" className="btn-primary w-full">Submit Offer</button>
          </form>
        </div>
      )}
    </div>
  );
};

const AdminDashboard: React.FC<{ onNavClick: (view: any, data?: any) => void; currentUser: User | null; setMessageBox: (box: { message: string; type: 'success' | 'error' | 'info' } | null) => void; }> = ({ onNavClick, currentUser, setMessageBox }) => {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center">Admin Dashboard</h1>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Admin Actions</h2>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <button onClick={() => onNavClick('all-users')} className="btn-primary w-full md:w-auto">
            Manage User Compliance
          </button>
          <button onClick={() => onNavClick('listings')} className="btn-secondary w-full md:w-auto">
            View All Listings
          </button>
        </div>
      </div>
    </div>
  );
};

const AllUsers: React.FC<{ users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>>; setMessageBox: (box: { message: string; type: 'success' | 'error' | 'info' } | null) => void; }> = ({ users, setUsers, setMessageBox }) => {
  const [actionLoadingUserId, setActionLoadingUserId] = useState<number | null>(null);

  const handleStatusChange = async (userId: number, newStatus: 'pending' | 'compliant' | 'non_compliant') => {
    setActionLoadingUserId(userId);
    try {
      const response = await apiCall(`/users/${userId}/compliance-status`, 'PUT', { compliance_status: newStatus });
      
      // Check if the response contains the updated user data
      if (response && response.user) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, complianceStatus: response.user.compliance_status } : user
          )
        );
        setMessageBox({ message: `User status updated to ${newStatus}.`, type: 'success' });
      } else {
        setMessageBox({ message: 'Failed to update user status: Unexpected response.', type: 'error' });
      }
    } catch (error) {
      setMessageBox({ message: 'Failed to update user status.', type: 'error' });
    } finally {
      setActionLoadingUserId(null);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center">Manage Users</h1>
      {users.length === 0 ? (
        <p className="text-center text-gray-500">No users found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(userItem => (
                <tr key={userItem.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{userItem.firstName} {userItem.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userItem.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userItem.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      userItem.complianceStatus === 'compliant' ? 'bg-green-100 text-green-800' :
                      userItem.complianceStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {userItem.complianceStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {userItem.role === 'buyer' && (
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
                          {actionLoadingUserId === userItem.id ? 'Updating...' : <><X className="w-4 h-4 mr-2" /> Reject</>}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
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
