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
  mineralName: string;
  description: string;
  quantity: number; // in tons
  pricePerTon: number; // in USD
  minerId: number;
  location: string;
  status: 'available' | 'sold' | 'pending';
}

interface Offer {
  id: number;
  listingId: number;
  buyerId: number;
  minerId: number;
  quantity: number;
  offeredPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

// User-friendly type for modals
type ModalType = 'login' | 'register' | 'addListing' | 'editListing' | 'addOffer' | 'viewOffers' | 'payment' | 'adminCompliance';

// Mock Data
const MOCK_USERS: User[] = [
  { id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', role: 'buyer', emailVerified: true, memberSince: 'January 15, 2024', companyName: 'Global Minerals Inc.', location: 'New York, NY', complianceStatus: 'compliant' },
  { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', role: 'miner', emailVerified: true, memberSince: 'February 20, 2023', companyName: 'Desert Mining Co.', location: 'Tucson, AZ', complianceStatus: 'compliant' },
  { id: 3, firstName: 'Bob', lastName: 'Johnson', email: 'bob.johnson@example.com', role: 'admin', emailVerified: true, memberSince: 'March 1, 2023', location: 'Austin, TX', complianceStatus: 'compliant' },
  { id: 4, firstName: 'Alice', lastName: 'Williams', email: 'alice.williams@example.com', role: 'buyer', emailVerified: false, memberSince: 'April 5, 2024', companyName: 'Mineral Traders LLC', location: 'Houston, TX', complianceStatus: 'pending' },
  { id: 5, firstName: 'Charlie', lastName: 'Brown', email: 'charlie.brown@example.com', role: 'miner', emailVerified: true, memberSince: 'May 10, 2024', companyName: 'Mountain Ore Co.', location: 'Denver, CO', complianceStatus: 'non_compliant' },
];

const MOCK_LISTINGS: Listing[] = [
  { id: 101, mineralName: 'Copper Ore', description: 'High-grade copper ore, 25% purity.', quantity: 500, pricePerTon: 8500, minerId: 2, location: 'Tucson, AZ', status: 'available' },
  { id: 102, mineralName: 'Iron Ore', description: 'Standard iron ore pellets.', quantity: 1500, pricePerTon: 120, minerId: 5, location: 'Denver, CO', status: 'available' },
  { id: 103, mineralName: 'Gold Ore', description: 'Raw gold ore from a new vein.', quantity: 10, pricePerTon: 65000, minerId: 2, location: 'Tucson, AZ', status: 'pending' },
  { id: 104, mineralName: 'Silver Ore', description: 'High-quality silver ore.', quantity: 100, pricePerTon: 25000, minerId: 5, location: 'Denver, CO', status: 'sold' },
];

const MOCK_OFFERS: Offer[] = [
  { id: 501, listingId: 101, buyerId: 1, minerId: 2, quantity: 100, offeredPrice: 8400, status: 'pending' },
  { id: 502, listingId: 103, buyerId: 4, minerId: 2, quantity: 5, offeredPrice: 60000, status: 'accepted' },
];


// API Helper Function (simplified for mock data)
async function apiCall(endpoint: string, method: string, data?: any, requiresAuth: boolean = true) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`API Call: ${method} ${endpoint}`, data);

  // Mock authentication logic
  if (requiresAuth && !localStorage.getItem('user')) {
    console.error('Authentication required for this endpoint.');
    return { error: 'Unauthorized' };
  }

  switch (endpoint) {
    case '/auth/login': {
      const user = MOCK_USERS.find(u => u.email === data.email);
      if (user && user.firstName === data.password) { // Mock password check
        localStorage.setItem('user', JSON.stringify(user));
        return { token: 'mock-token', user };
      }
      return { error: 'Invalid credentials' };
    }
    case '/auth/register': {
      const newUser = { ...data, id: Math.floor(Math.random() * 1000), memberSince: new Date().toDateString(), role: data.role, emailVerified: false, complianceStatus: 'pending' };
      MOCK_USERS.push(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return { token: 'mock-token', user: newUser };
    }
    case '/users/admin-compliance': {
        const user = MOCK_USERS.find(u => u.email === data.email);
        return { status: 'success', user };
    }
    case '/users/admin-compliance/update': {
        const userIndex = MOCK_USERS.findIndex(u => u.id === data.userId);
        if (userIndex !== -1) {
            MOCK_USERS[userIndex].complianceStatus = data.newStatus;
            return { status: 'success' };
        }
        return { error: 'User not found' };
    }
    default:
      return { message: 'Success' };
  }
}

// Reusable Modal Component
const Modal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void; }) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-70 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
    <div className="relative bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg mx-auto transform transition-all scale-100 opacity-100 border-t-8 border-indigo-600">
      <div className="flex justify-between items-start">
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="mt-6">
        {children}
      </div>
    </div>
  </div>
);

// Reusable Message Box Component
const MessageBox = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'warning'; onClose: () => void; }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const colorClass = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-yellow-500';
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : Info;

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-lg text-white font-bold transition-all duration-300 transform scale-100 z-50 ${colorClass}`}>
      <div className="flex items-center">
        <Icon className="w-6 h-6 mr-2" />
        <span>{message}</span>
        <button onClick={() => setIsVisible(false)} className="ml-4 -mr-2">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);
  const [offers, setOffers] = useState<Offer[]>(MOCK_OFFERS);
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [messageBox, setMessageBox] = useState<{ message: string; type: 'success' | 'error' | 'warning'; } | null>(null);
  const [showAdminCompliance, setShowAdminCompliance] = useState(false);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [actionLoadingUserId, setActionLoadingUserId] = useState<number | null>(null);

  // State for forms
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'buyer' as 'buyer' | 'miner' | 'admin',
    companyName: '',
    phoneNumber: '',
    location: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setMessageBox({ message: 'Logged out successfully!', type: 'success' });
  };

  // Corrected to be an async function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await apiCall('/auth/login', 'POST', { email: loginEmail, password: loginPassword }, false);
    if (result.token) {
      setUser(result.user);
      setActiveModal(null);
      setMessageBox({ message: `Welcome, ${result.user.firstName}!`, type: 'success' });
    } else {
      setMessageBox({ message: result.error || 'Login failed.', type: 'error' });
    }
  };

  // Corrected to be an async function
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Corrected endpoint from /users/register to /auth/register
      const response = await apiCall('/auth/register', 'POST', registerForm, false);
      if (response && response.token) {
        setMessageBox({ message: 'Registration successful!', type: 'success' });
        setUser(response.user);
        setActiveModal(null);
      } else {
        setMessageBox({ message: response.error || 'Registration failed.', type: 'error' });
      }
    } catch (error) {
      setMessageBox({ message: 'An unexpected error occurred during registration.', type: 'error' });
    }
  };

  // Admin Compliance Logic
  const fetchUsersForAdmin = useCallback(async () => {
    if (user?.role === 'admin') {
      setAdminUsers(MOCK_USERS); // Using mock data directly for now
    }
  }, [user]);

  useEffect(() => {
    if (showAdminCompliance) {
      fetchUsersForAdmin();
    }
  }, [showAdminCompliance, fetchUsersForAdmin]);

  const handleStatusChange = async (userId: number, newStatus: User['complianceStatus']) => {
    setActionLoadingUserId(userId);
    const result = await apiCall('/users/admin-compliance/update', 'POST', { userId, newStatus });
    if (result.status === 'success') {
      setMessageBox({ message: `User status updated to ${newStatus}.`, type: 'success' });
      fetchUsersForAdmin(); // Refresh the list
    } else {
      setMessageBox({ message: result.error || 'Failed to update status.', type: 'error' });
    }
    setActionLoadingUserId(null);
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
                      {listing.mineralName}
                    </h3>
                    <p className="text-gray-600 mb-2 truncate">{listing.description}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {listing.location}
                    </div>
                    <div className="flex items-center text-sm font-semibold text-gray-700 mb-4">
                      <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                      ${listing.pricePerTon} / ton
                    </div>
                    <div className="flex items-center text-sm font-semibold text-gray-700 mb-4">
                      <TrendingUp className="w-4 h-4 mr-1 text-blue-600" />
                      {listing.quantity} tons available
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              <LogIn className="w-5 h-5 mr-2" /> Login
            </button>
          </form>
        </Modal>
      )}

      {activeModal === 'register' && (
        <Modal title="Create a New Account" onClose={() => setActiveModal(null)}>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input type="text" value={registerForm.firstName} onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input type="text" value={registerForm.lastName} onChange={(e) => setRegisterForm({...registerForm, lastName: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={registerForm.email} onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" value={registerForm.password} onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={registerForm.role} onChange={(e) => setRegisterForm({...registerForm, role: e.target.value as 'buyer' | 'miner'})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                <option value="buyer">Buyer</option>
                <option value="miner">Miner</option>
              </select>
            </div>
            {registerForm.role === 'miner' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input type="text" value={registerForm.companyName} onChange={(e) => setRegisterForm({...registerForm, companyName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
            )}
            <button type="submit" className="btn btn-primary w-full">
              <UserPlus className="w-5 h-5 mr-2" /> Register
            </button>
          </form>
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
