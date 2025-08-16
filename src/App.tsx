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
  X,
  CreditCard,
  UserPlus,
  LogIn,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldOff,
  ShieldQuestion,
  EyeOff
} from 'lucide-react';

// Types
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'buyer' | 'miner' | 'admin';
  emailVerified: boolean;
  memberSince: string;
  companyName?: string;
  phoneNumber?: string;
  location?: string;
  complianceStatus: 'pending' | 'compliant' | 'non_compliant';
  preferredMineralTypes?: string[];
  minimumPurchaseQuantity?: number;
  requiredRegulations?: string[];
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
  seller_company_name?: string;
  seller_location?: string;
  seller_compliance_status?: 'pending' | 'compliant' | 'non_compliant';
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
  created_at?: string;
  updated_at?: string;
}

// Base URL for your backend API
const API_BASE_URL = 'https://mining-marketplace-backend-29u8.onrender.com/api';

// API Helper Function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log(`apiCall: Sending token for ${endpoint.split('?')[0]}`);
  } else {
    console.log(`apiCall: No token found for ${endpoint.split('?')[0]}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error or malformed JSON response' }));
    console.error(`apiCall Error for ${endpoint}: HTTP ${response.status}`, errorData);
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

// --- Generic Loading Spinner Component ---
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center flex-col">
    <div className="loading-spinner w-12 h-12 text-blue-600 mb-4"></div>
    <p className="text-gray-700">{message}</p>
  </div>
);

// --- Component Definitions ---
// Login Form Component
const LoginForm: React.FC<{ onLogin: (user: User) => void; onSwitchToRegister: () => void; }> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log("LoginForm: Simulating login API call...");
      const response = await apiCall('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      console.log("LoginForm: Login successful. User data:", response);

      const { token, user } = response;
      localStorage.setItem('authToken', token);

      onLogin(user);

    } catch (err: any) {
      console.error("LoginForm: Login failed:", err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      console.log("LoginForm: Simulating demo login...");
      const response = await apiCall('/users/login-demo', { method: 'POST' });
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('role', response.user.role);
      console.log("LoginForm: Demo Token stored in localStorage.");
      onLogin(response.user);
    } catch (err: any) {
      console.error("LoginForm: Demo login failed:", err);
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white shadow-xl rounded-2xl w-full max-w-sm mx-auto">
      <LogIn className="w-12 h-12 text-indigo-600 mb-4" />
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Log In</h2>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <form onSubmit={handleLogin} className="w-full">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          disabled={isLoading}
        >
          {isLoading ? 'Logging In...' : 'Log In'}
        </button>
      </form>
      <button
        onClick={handleDemoLogin}
        className="mt-4 w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        disabled={isLoading}
      >
        Demo Login
      </button>
      <p className="mt-6 text-sm text-gray-600">
        Don't have an account?{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSwitchToRegister();
          }}
          className="text-indigo-600 font-semibold hover:text-indigo-800"
        >
          Register here
        </a>
      </p>
    </div>
  );
};

// Register Form Component
const RegisterForm: React.FC<{ onRegisterSuccess: (user: User) => void; onSwitchToLogin: () => void; }> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'miner'>('buyer');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiCall('/users/register', {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName, email, password, role }),
      });
      console.log("RegisterForm: Registration successful. User data:", response);

      const { token, user } = response;
      localStorage.setItem('authToken', token);

      onRegisterSuccess(user);

    } catch (err: any) {
      console.error("RegisterForm: Registration failed:", err);
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white shadow-xl rounded-2xl w-full max-w-md mx-auto">
      <UserPlus className="w-12 h-12 text-teal-600 mb-4" />
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create an Account</h2>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <form onSubmit={handleRegister} className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="firstName">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="lastName">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Account Type
          </label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="role"
                value="buyer"
                checked={role === 'buyer'}
                onChange={() => setRole('buyer')}
                className="form-radio text-teal-600"
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
                className="form-radio text-teal-600"
              />
              <span className="ml-2 text-gray-700">Miner</span>
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="mt-6 text-sm text-gray-600">
        Already have an account?{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSwitchToLogin();
          }}
          className="text-teal-600 font-semibold hover:text-teal-800"
        >
          Log In
        </a>
      </p>
    </div>
  );
};

// --- Dashboard & Main App Components ---

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onNavigate }) => {
  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <header className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-xl shadow-md mb-6">
        <div className="flex items-center space-x-2 mb-4 sm:mb-0">
          <ShoppingBag className="w-8 h-8 text-indigo-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Mining Marketplace</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm font-semibold text-gray-700">
            Welcome, {user.firstName}!
          </div>
          <button
            onClick={onLogout}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap justify-center sm:justify-start space-x-2 sm:space-x-4 mb-6">
        <button onClick={() => onNavigate('dashboard')} className="nav-btn">
          <Home className="w-5 h-5 mr-2" /> Dashboard
        </button>
        <button onClick={() => onNavigate('marketplace')} className="nav-btn">
          <Search className="w-5 h-5 mr-2" /> Marketplace
        </button>
        <button onClick={() => onNavigate('my-listings')} className="nav-btn">
          <Package className="w-5 h-5 mr-2" /> My Listings
        </button>
        <button onClick={() => onNavigate('my-offers')} className="nav-btn">
          <DollarSign className="w-5 h-5 mr-2" /> My Offers
        </button>
        {user.role === 'admin' && (
          <button onClick={() => onNavigate('admin-users')} className="nav-btn">
            <Users className="w-5 h-5 mr-2" /> Admin Users
          </button>
        )}
        {user.role === 'admin' && (
          <button onClick={() => onNavigate('admin-listings')} className="nav-btn">
            <TrendingUp className="w-5 h-5 mr-2" /> Admin Listings
          </button>
        )}
      </nav>

      <main>
        <div className="p-4 bg-white rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4">Dashboard Overview</h2>
          <p>This is the main dashboard content. You can add widgets, statistics, and quick links here.</p>
        </div>
      </main>
    </div>
  );
};

// --- Marketplace Component ---
interface MarketplaceProps {
  onNavigate: (view: string) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ onNavigate }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await apiCall('/marketplace/listings/listings');
        console.log("App: Listings received:", data);
        setListings(data);
      } catch (err: any) {
        console.error("App: Error fetching all listings:", err);
        setError(err.message || 'Failed to fetch listings.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, []);

  if (isLoading) return <LoadingSpinner message="Fetching marketplace listings..." />;
  if (error) return <div className="text-center text-red-500 mt-8">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Marketplace Listings</h2>
        <button onClick={() => onNavigate('dashboard')} className="flex items-center text-indigo-600 hover:text-indigo-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">{listing.mineral_type}</h3>
              <div className={`px-3 py-1 text-xs font-bold rounded-full ${listing.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">{listing.description}</p>
            <div className="space-y-2">
              <div className="flex items-center text-gray-500">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{listing.location}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <DollarSign className="w-4 h-4 mr-2" />
                <span>{listing.price_per_unit} {listing.currency} / {listing.unit}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <Package className="w-4 h-4 mr-2" />
                <span>{listing.quantity} {listing.unit}</span>
              </div>
              {listing.seller_company_name && (
                <div className="flex items-center text-gray-500">
                  <User className="w-4 h-4 mr-2" />
                  <span>Seller: {listing.seller_company_name}</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <button className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MyListings Component ---
interface MyListingsProps {
  onNavigate: (view: string) => void;
}

const MyListings: React.FC<MyListingsProps> = ({ onNavigate }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        const data = await apiCall('/marketplace/listings/my-listings');
        setListings(data);
      } catch (err: any) {
        console.error("MyListings: Error fetching my listings:", err);
        setError(err.message || 'Failed to fetch your listings.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyListings();
  }, []);

  if (isLoading) return <LoadingSpinner message="Fetching your listings..." />;
  if (error) return <div className="text-center text-red-500 mt-8">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Listings</h2>
        <button onClick={() => onNavigate('dashboard')} className="flex items-center text-indigo-600 hover:text-indigo-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">{listing.mineral_type}</h3>
            <p className="text-gray-600 text-sm mt-2">{listing.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                <X className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {listings.length === 0 && (
        <p className="text-center text-gray-500 mt-8">You have no listings yet.</p>
      )}
    </div>
  );
};


// --- MyOffers Component ---
interface MyOffersProps {
  onNavigate: (view: string) => void;
}

const MyOffers: React.FC<MyOffersProps> = ({ onNavigate }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyOffers = async () => {
      try {
        const data = await apiCall('/marketplace/offers/my-offers');
        setOffers(data);
        console.log("MyOffers: Offers fetched successfully:", data);
      } catch (err: any) {
        console.error("MyOffers: Error fetching offers:", err);
        setError(err.message || 'Failed to fetch your offers.');
      } finally {
        setIsLoading(false);
        console.log("MyOffers: Finished fetching offers. isLoading:", false);
      }
    };

    fetchMyOffers();
  }, []);

  if (isLoading) return <LoadingSpinner message="Fetching your offers..." />;
  if (error) return <div className="text-center text-red-500 mt-8">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Offers</h2>
        <button onClick={() => onNavigate('dashboard')} className="flex items-center text-indigo-600 hover:text-indigo-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <div key={offer.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Offer for {offer.listing_mineral_type}</h3>
            <p className="text-gray-600 text-sm mt-2">
              You offered **{offer.offer_quantity} {offer.listing_currency}** for **{offer.listing_mineral_type}** at a price of **{offer.offer_price} {offer.listing_currency}** per unit.
            </p>
            <div className="mt-4">
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                Status: {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
              </span>
            </div>
            <div className="mt-4 flex space-x-2">
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                View Offer
              </button>
            </div>
          </div>
        ))}
      </div>
      {offers.length === 0 && (
        <p className="text-center text-gray-500 mt-8">You have not made any offers yet.</p>
      )}
    </div>
  );
};

// --- AdminUsers Component ---
interface AdminUsersProps {
  onNavigate: (view: string) => void;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ onNavigate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingUserId, setActionLoadingUserId] = useState<number | null>(null);
  const [messageBox, setMessageBox] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchAllUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiCall('/users');
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch all users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleStatusChange = async (userId: number, status: 'compliant' | 'pending' | 'non_compliant') => {
    setActionLoadingUserId(userId);
    try {
      await apiCall(`/users/${userId}/compliance-status`, {
        method: 'PUT',
        body: JSON.stringify({ complianceStatus: status }),
      });
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, complianceStatus: status } : u));
      setMessageBox({ message: `User status updated to ${status}.`, type: 'success' });
    } catch (err: any) {
      console.error("AdminUsers: Failed to update user status:", err);
      setMessageBox({ message: err.message || 'Failed to update user status.', type: 'error' });
    } finally {
      setActionLoadingUserId(null);
    }
  };

  const getStatusIcon = (status: 'compliant' | 'pending' | 'non_compliant') => {
    switch (status) {
      case 'compliant':
        return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <ShieldQuestion className="w-5 h-5 text-yellow-500" />;
      case 'non_compliant':
        return <ShieldOff className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (isLoading) return <LoadingSpinner message="Fetching user data..." />;
  if (error) return <div className="text-center text-red-500 mt-8">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Admin - Manage Users</h2>
        <button onClick={() => onNavigate('dashboard')} className="flex items-center text-indigo-600 hover:text-indigo-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </button>
      </div>
      {users.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((userItem) => (
                <tr key={userItem.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{userItem.firstName} {userItem.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userItem.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userItem.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(userItem.complianceStatus)}
                      <span className="capitalize">{userItem.complianceStatus.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {userItem.role === 'buyer' && (
                      <div className="flex items-center space-x-2">
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


// --- AdminListings Component ---
interface AdminListingsProps {
  onNavigate: (view: string) => void;
}

const AdminListings: React.FC<AdminListingsProps> = ({ onNavigate }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllListings = async () => {
      setIsLoading(true);
      try {
        const data = await apiCall('/marketplace/listings/all');
        setListings(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch all listings for admin.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllListings();
  }, []);

  if (isLoading) return <LoadingSpinner message="Fetching all listings..." />;
  if (error) return <div className="text-center text-red-500 mt-8">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Admin - All Listings</h2>
        <button onClick={() => onNavigate('dashboard')} className="flex items-center text-indigo-600 hover:text-indigo-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </button>
      </div>
      {listings.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mineral Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {listings.map((listing) => (
                <tr key={listing.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{listing.mineral_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{listing.quantity} {listing.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{listing.seller_company_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      listing.status === 'available' ? 'bg-green-100 text-green-800' :
                      listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      listing.status === 'sold' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{listing.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {listings.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No listings found.</p>
      )}
    </div>
  );
};


// --- Main App Component ---
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    setCurrentView('login');
    console.log("handleLogout: Clearing authToken from localStorage.");
  };

  const navigateTo = (view: string) => {
    setCurrentView(view);
  };

  // Auth check and initial render logic
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const user = await apiCall('/users/profile');
          setCurrentUser(user);
          setCurrentView('dashboard');
        } catch (err) {
          console.error("Auth check failed:", err);
          localStorage.removeItem('authToken');
          setCurrentView('login');
        }
      } else {
        setCurrentView('login');
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  if (authLoading) {
    return <LoadingSpinner message="Checking authentication status..." />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <LoginForm onLogin={handleLogin} onSwitchToRegister={() => setCurrentView('register')} />;
      case 'register':
        return <RegisterForm onRegisterSuccess={handleLogin} onSwitchToLogin={() => setCurrentView('login')} />;
      case 'dashboard':
        if (!currentUser) return <LoadingSpinner message="Redirecting to login..." />;
        return <Dashboard user={currentUser} onLogout={handleLogout} onNavigate={navigateTo} />;
      case 'marketplace':
        return <Marketplace onNavigate={navigateTo} />;
      case 'my-listings':
        return <MyListings onNavigate={navigateTo} />;
      case 'my-offers':
        return <MyOffers onNavigate={navigateTo} />;
      case 'admin-users':
        return <AdminUsers onNavigate={navigateTo} />;
      case 'admin-listings':
        return <AdminListings onNavigate={navigateTo} />;
      default:
        return <div className="p-8 text-center text-gray-500">View not found.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-800">
      {renderView()}
    </div>
  );
};

export default App;
