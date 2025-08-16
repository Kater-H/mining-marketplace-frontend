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
  EyeOff, // For hide password
  PackagePlus,
  ArrowUpCircle,
  ArrowDownCircle,
  Info
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
  mineral_type: string;
  description: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  currency: string;
  location: string; // Listing's location
  status: 'available' | 'pending' | 'sold' | 'canceled';
  listed_date: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
  // NEW: Seller's company name and location to display on listing
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
}

// Global state and utility functions
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
    console.log(`apiCall: Sending token for ${endpoint.split('?')[0]}`); // Log when token is sent
  } else {
    console.log(`apiCall: No token found for ${endpoint.split('?')[0]}`); // Log when no token is found
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error or malformed JSON response' }));
    console.error(`apiCall Error for ${endpoint}: HTTP ${response.status}`, errorData); // Log error details
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
          <button onClick={onClose} className="bg-white text-gray-800 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"> OK </button>
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
  const [showPassword, setShowPassword] = useState(false); // NEW: State for password visibility

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
      console.log("LoginForm: Token stored in localStorage:", response.token ? "YES" : "NO");
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
        location: response.user.location,
        complianceStatus: response.user.complianceStatus
      };
      onLogin(loggedInUser);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full rounded-md border-gray-300 pr-10"
            />
            <span
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </span>
          </div>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Logging In...' : <><LogIn className="w-5 h-5 mr-2" /> Login</>}
        </button>
      </form>
      <div className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="#" onClick={onSwitchToRegister} className="text-indigo-600 hover:text-indigo-800 font-medium">
          Register here.
        </a>
      </div>
    </div>
  );
};

// Register Form Component
const RegisterForm: React.FC<{ onRegister: (user: User) => void; onSwitchToLogin: () => void; }> = ({ onRegister, onSwitchToLogin }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'buyer' as 'buyer' | 'miner', companyName: '', phoneNumber: '', location: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await apiCall('/users/register', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      localStorage.setItem('authToken', response.token);
      const newUser: User = {
        id: response.user.id,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        email: response.user.email,
        role: response.user.role,
        emailVerified: response.user.emailVerified,
        memberSince: response.user.memberSince,
        companyName: response.user.companyName,
        phoneNumber: response.user.phoneNumber,
        location: response.user.location,
        complianceStatus: response.user.complianceStatus
      };
      onRegister(newUser);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input type="text" name="firstName" value={form.firstName} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input type="text" name="lastName" value={form.lastName} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select name="role" value={form.role} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
            <option value="buyer">Buyer</option>
            <option value="miner">Miner</option>
          </select>
        </div>
        {form.role === 'miner' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input type="text" name="companyName" value={form.companyName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input type="text" name="location" value={form.location} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
          </>
        )}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : <><UserPlus className="w-5 h-5 mr-2" /> Register</>}
        </button>
      </form>
      <div className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="#" onClick={onSwitchToLogin} className="text-indigo-600 hover:text-indigo-800 font-medium">
          Login here.
        </a>
      </div>
    </div>
  );
};


// Main App Component
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [messageBox, setMessageBox] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; } | null>(null);
  const [showAdminCompliance, setShowAdminCompliance] = useState(false);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [actionLoadingUserId, setActionLoadingUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    setMessageBox({ message: 'Logged out successfully!', type: 'success' });
  };

  const fetchListings = useCallback(async () => {
    try {
      const data = await apiCall('/marketplace/listings');
      setListings(data);
    } catch (error: any) {
      setMessageBox({ message: error.message || 'Failed to fetch listings.', type: 'error' });
    }
  }, []);

  // Fetch listings on initial load or when user logs in
  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user, fetchListings]);

  // Admin Compliance Logic
  const fetchUsersForAdmin = useCallback(async () => {
    if (user?.role === 'admin') {
      try {
        const data = await apiCall('/users/admin-compliance');
        setAdminUsers(data);
      } catch (error: any) {
        setMessageBox({ message: error.message || 'Failed to fetch user compliance data.', type: 'error' });
      }
    }
  }, [user]);

  useEffect(() => {
    if (showAdminCompliance) {
      fetchUsersForAdmin();
    }
  }, [showAdminCompliance, fetchUsersForAdmin]);

  const handleStatusChange = async (userId: number, newStatus: User['complianceStatus']) => {
    setActionLoadingUserId(userId);
    try {
      await apiCall(`/users/${userId}/compliance-status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      setMessageBox({ message: `User status updated to ${newStatus}.`, type: 'success' });
      fetchUsersForAdmin(); // Refresh the list
    } catch (error: any) {
      setMessageBox({ message: error.message || 'Failed to update status.', type: 'error' });
    } finally {
      setActionLoadingUserId(null);
    }
  };

  // Admin Compliance View
  const AdminComplianceView = () => (
    <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Compliance Management</h2>
        <button onClick={() => setShowAdminCompliance(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-6 h-6" /> Back
        </button>
      </div>
      <p className="text-gray-600 mb-6">Review and manage the compliance status of all users, especially miners and buyers.</p>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden shadow">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
              <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-4 sm:px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {adminUsers.map(userItem => (
              <tr key={userItem.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{userItem.firstName} {userItem.lastName}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userItem.email}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{userItem.role}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                  {userItem.complianceStatus === 'compliant' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Compliant</span>}
                  {userItem.complianceStatus === 'pending' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>}
                  {userItem.complianceStatus === 'non_compliant' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {userItem.role !== 'admin' && (
                    <div className="flex space-x-2 justify-end">
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
    </div>
  );


  // JSX for the main application
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased text-gray-800">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">Mining Marketplace</span>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700 hidden sm:block">Hello, <span className="font-semibold">{user.firstName}</span>!</span>
                {user.role === 'admin' && (
                  <button onClick={() => setShowAdminCompliance(true)} className="btn btn-primary">
                    <ShieldCheck className="w-5 h-5 mr-2" /> Admin Dashboard
                  </button>
                )}
                <button onClick={handleLogout} className="btn btn-secondary">
                  <LogOut className="w-5 h-5 mr-2" /> Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setActiveModal('login')} className="btn btn-secondary">
                  <LogIn className="w-5 h-5 mr-2" /> Login
                </button>
                <button onClick={() => setActiveModal('register')} className="btn btn-primary">
                  <UserPlus className="w-5 h-5 mr-2" /> Register
                </button>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-8">
        {!user && (
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <h1 className="text-3xl font-bold mb-4">Welcome to the Mining Marketplace</h1>
            <p className="text-lg text-gray-600 mb-6">Login or register to view and trade mineral listings.</p>
            <div className="flex justify-center space-x-4">
              <button onClick={() => setActiveModal('login')} className="btn btn-secondary btn-lg">Login</button>
              <button onClick={() => setActiveModal('register')} className="btn btn-primary btn-lg">Register</button>
            </div>
          </div>
        )}

        {user && !showAdminCompliance && (
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border-t-8 border-indigo-600 animate-slide-in">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Marketplace Listings</h2>
              <p className="text-gray-600 mb-6">Browse available mineral listings from miners around the world.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(listing => (
                  <div key={listing.id} className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-md">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center mb-2">
                      <Package className="w-5 h-5 mr-2 text-indigo-500" />
                      {listing.mineral_type}
                    </h3>
                    <p className="text-gray-600 mb-2 truncate">{listing.description}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {listing.location}
                    </div>
                    <div className="flex items-center text-sm font-semibold text-gray-700 mb-4">
                      <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                      ${listing.price_per_unit} / {listing.unit}
                    </div>
                    <div className="flex items-center text-sm font-semibold text-gray-700 mb-4">
                      <TrendingUp className="w-4 h-4 mr-1 text-blue-600" />
                      {listing.quantity} {listing.unit} available
                    </div>
                    <div className="flex justify-end mt-4">
                      <button className="btn btn-primary btn-sm">
                        <ArrowUpCircle className="w-4 h-4 mr-2" />Make Offer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        )}
        
        {/* Admin Compliance View */}
        {user?.role === 'admin' && showAdminCompliance && <AdminComplianceView />}
      </main>

      {/* Modals */}
      {activeModal === 'login' && (
        <Modal title="Login to Your Account" onClose={() => setActiveModal(null)}>
          <LoginForm
            onLogin={(loggedInUser) => {
              setUser(loggedInUser);
              setActiveModal(null);
              setMessageBox({ message: `Welcome, ${loggedInUser.firstName}!`, type: 'success' });
            }}
            onSwitchToRegister={() => setActiveModal('register')}
          />
        </Modal>
      )}

      {activeModal === 'register' && (
        <Modal title="Create a New Account" onClose={() => setActiveModal(null)}>
          <RegisterForm
            onRegister={(newUser) => {
              setUser(newUser);
              setActiveModal(null);
              setMessageBox({ message: 'Registration successful!', type: 'success' });
            }}
            onSwitchToLogin={() => setActiveModal('login')}
          />
        </Modal>
      )}

      {/* Message Box */}
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

export default App;
