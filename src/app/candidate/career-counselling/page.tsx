'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CandidateLayout from '@/components/CandidateLayout';
import PhoneNumberSelector from '@/components/PhoneNumberSelector';
import { toE164 } from '@/utils/phone';
import { 
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  DollarSign,
  Loader2,
  RefreshCw,
  Plus,
  XCircle,
  User,
  Mail,
  Phone
} from 'lucide-react';

interface CounsellingOrder {
  id: number;
  candidateName?: string;
  email: string;
  phone: string;
  preferredDatetime: string;
  sessionMode: 'online' | 'in_person';
  city?: string;
  notes?: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  amountTZS: number;
  amountUSD: number;
}

export default function CareerCounsellingPage() {
  return (
    <CandidateLayout>
      <Suspense fallback={
        <div className="w-full space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded-lg mb-4 animate-shimmer"></div>
          <div className="h-32 bg-gray-200 rounded-lg animate-shimmer"></div>
        </div>
      }>
        <CareerCounsellingContent />
      </Suspense>
    </CandidateLayout>
  );
}

function CareerCounsellingContent() {
  const searchParams = useSearchParams();
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [orders, setOrders] = useState<CounsellingOrder[]>([]);
  const [amountTZS, setAmountTZS] = useState(50000);
  const [amountUSD, setAmountUSD] = useState(0);
  const [formattedTZS, setFormattedTZS] = useState('TZS 50,000');
  const [formattedUSD, setFormattedUSD] = useState('$0.00');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Booking form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dialCode, setDialCode] = useState('+255');
  const [phone, setPhone] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [mode, setMode] = useState<'online' | 'in_person'>('online');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  // Get candidate ID from token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCandidateId(payload.sub || payload.candidateId || payload.id || null);
      } catch (error) {
        // Error parsing token
      }
    }
  }, []);

  // Fetch exchange rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('/api/cv-builder/exchange-rate');
        if (response.ok) {
          const data = await response.json();
          const rate = data.rate || 2678;
          const usd = amountTZS / rate;
          setAmountUSD(usd);
          setFormattedTZS(new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(amountTZS));
          setFormattedUSD(new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(usd));
        }
      } catch (error) {
        // Fallback to default rate
        const defaultRate = 2678;
        const usd = amountTZS / defaultRate;
        setAmountUSD(usd);
        setFormattedTZS(new Intl.NumberFormat('en-TZ', {
          style: 'currency',
          currency: 'TZS',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amountTZS));
        setFormattedUSD(new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(usd));
      }
    };
    fetchExchangeRate();
  }, [amountTZS]);

  // Fetch order status
  const fetchOrderStatus = async () => {
    if (!candidateId) {
      setIsLoadingOrder(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/career-counselling/order-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.hasOrder) {
          setOrders(data.orders || []);
        } else {
          setOrders([]);
        }
      }
    } catch (error) {
      // Error fetching order status
    } finally {
      setIsLoadingOrder(false);
    }
  };

  // Fetch orders on mount and when candidateId changes
  useEffect(() => {
    if (candidateId) {
      fetchOrderStatus();
    }
  }, [candidateId]);

  // Poll for pending orders
  useEffect(() => {
    if (!candidateId) return;

    const interval = setInterval(() => {
      const hasPendingOrder = orders.some(o => o.paymentStatus === 'pending');
      if (hasPendingOrder) {
        fetchOrderStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [candidateId, orders]);

  // Handle payment success/cancel from URL
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      setTimeout(() => {
        fetchOrderStatus();
      }, 2000);

      setSuccessMessage('Payment successful! Your career counselling session has been booked. You will receive a confirmation email shortly.');
      setShowSuccessModal(true);
      window.history.replaceState({}, '', '/candidate/career-counselling');
    } else if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, '', '/candidate/career-counselling');
    }
  }, [searchParams]);

  // Handle booking and payment
  const handleBooking = async () => {
    if (!fullName.trim()) {
      alert('Please enter your full name.');
      return;
    }

    const validEmail = (e: string) => /.+@.+\..+/.test(e);
    if (!validEmail(email.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

    const e164 = toE164(dialCode, phone);
    if (!e164) {
      alert('Please enter a valid phone number.');
      return;
    }

    if (!dateTime) {
      alert('Please pick a preferred date & time.');
      return;
    }

    if (mode === 'in_person' && !city.trim()) {
      alert('Please specify the city for in-person session.');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please log in to continue with booking.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      let candidateIdToSend = candidateId;
      if (!candidateIdToSend) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          candidateIdToSend = payload.sub || payload.candidateId || payload.id;
        } catch (error) {
          // Error parsing token
        }
      }

      const response = await fetch('/api/career-counselling/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          candidateId: candidateIdToSend,
          bookingData: {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: e164,
            preferredDatetime: dateTime,
            sessionMode: mode,
            city: mode === 'in_person' ? city.trim() : null,
            notes: notes.trim() || null
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create payment session. Please try again.');
        setIsProcessingPayment(false);
      }
    } catch (error: any) {
      alert('An error occurred. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (order: CounsellingOrder) => {
    if (order.paymentStatus === 'pending') {
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <Clock className="w-3 h-3" />Pending Payment
        </span>
      );
    }
    if (order.paymentStatus === 'completed' && order.status === 'scheduled') {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <Calendar className="w-3 h-3" />Scheduled
        </span>
      );
    }
    if (order.status === 'completed') {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <CheckCircle className="w-3 h-3" />Completed
        </span>
      );
    }
    if (order.paymentStatus === 'failed') {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <XCircle className="w-3 h-3" />Failed
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
        {order.status}
      </span>
    );
  };

  // Shimmer loading state
  if (isLoadingOrder) {
    return (
      <div className="w-full space-y-6">
        {/* Header Shimmer */}
        <div className="bg-gradient-to-r from-[#114373] via-[#1a4d7a] to-[#114373] rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          <div className="relative z-10">
            <div className="h-8 w-64 bg-white/20 rounded-lg mb-3 animate-shimmer"></div>
            <div className="h-5 w-96 bg-white/20 rounded-lg animate-shimmer"></div>
          </div>
        </div>

        {/* Stats Cards Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-shimmer"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-7 w-16 bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-shimmer"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Shimmer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-40 bg-gray-200 rounded mb-6 animate-shimmer"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-48 bg-gray-200 rounded animate-shimmer"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-shimmer"></div>
                    </div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-shimmer"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-36 bg-gray-200 rounded mb-4 animate-shimmer"></div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-4 w-full bg-gray-200 rounded animate-shimmer"></div>
              ))}
            </div>
            <div className="h-12 w-full bg-gray-200 rounded-lg mt-6 animate-shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  const scheduledOrders = orders.filter(o => o.status === 'scheduled').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#114373] via-[#1a4d7a] to-[#114373] rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Career Counselling Session</h1>
            <p className="text-white/90 text-lg">
              Invest in your future – get expert guidance to unlock your career potential.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            <DollarSign className="w-5 h-5" />
            <div>
              <div className="text-xs text-white/80">Session Fee</div>
              <div className="text-sm font-bold">{formattedTZS}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{scheduledOrders}</div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{completedOrders}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Bookings Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#114373]" />
              My Bookings
            </h2>
            <button
              onClick={fetchOrderStatus}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
              <p className="text-gray-600 mb-6">Book your first career counselling session below</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {order.candidateName || `Booking #${order.id}`}
                        </h3>
                        {getStatusBadge(order)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Session:</span> {formatDate(order.preferredDatetime)}
                        </div>
                        <div>
                          <span className="font-medium">Mode:</span> {order.sessionMode === 'online' ? 'Online' : 'In-person'}
                        </div>
                        {order.city && (
                          <div>
                            <span className="font-medium">City:</span> {order.city}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Amount:</span>{' '}
                          {new Intl.NumberFormat('en-TZ', {
                            style: 'currency',
                            currency: 'TZS',
                            minimumFractionDigits: 0
                          }).format(order.amountTZS)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Book Session Section */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#114373]" />
            Book Session
          </h2>
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">Personalized career assessment</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">Resume & interview guidance</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">Goal setting and roadmap planning</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">30-60 minutes session</p>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Fee:</span>
              <span className="text-lg font-bold text-gray-900">{formattedTZS}</span>
            </div>
            <div className="text-xs text-gray-500 text-right">({formattedUSD})</div>
          </div>
          <button
            onClick={() => setShowBookingModal(true)}
            className="w-full bg-gradient-to-r from-[#114373] to-[#0d3559] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#0d3559] hover:to-[#114373] transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Book Session
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Book Career Counselling Session</h3>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setFullName('');
                  setEmail('');
                  setDialCode('+255');
                  setPhone('');
                  setDateTime('');
                  setMode('online');
                  setCity('');
                  setNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <PhoneNumberSelector
                  countryCode={dialCode}
                  phoneNumber={phone}
                  onCountryCodeChange={setDialCode}
                  onPhoneNumberChange={setPhone}
                  label="Phone Number *"
                  placeholder="712 345 678"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Mode *</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as 'online' | 'in_person')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  >
                    <option value="online">Online</option>
                    <option value="in_person">In-person</option>
                  </select>
                </div>
              </div>

              {mode === 'in_person' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City (for In-person) *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes / Questions (optional)</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  placeholder="Any specific topics you'd like to discuss..."
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 border-t border-gray-200 pt-4">
              <button
                onClick={handleBooking}
                disabled={isProcessingPayment}
                className="flex-1 bg-[#114373] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#0d3559] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Book & Pay Now
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setFullName('');
                  setEmail('');
                  setDialCode('+255');
                  setPhone('');
                  setDateTime('');
                  setMode('online');
                  setCity('');
                  setNotes('');
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-[#114373] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#0d3559] transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
