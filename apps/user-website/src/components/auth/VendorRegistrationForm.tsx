import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { updateVendorProfile, uploadImage, updateProfile } from '../../lib/api';

export const VendorRegistrationForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    email: '',
    vendor_type: '',
    district: '',
    pincode: '',
    business_file: null as File | null,
    terms: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        setFormData(prev => ({ ...prev, [name]: files[0] }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.terms) {
      toast.error('You must agree to the Terms & Conditions.');
      return;
    }
    
    setLoading(true);
    try {
      let imageUrl = null;
      if (formData.business_file) {
        const uploadRes = await uploadImage(formData.business_file);
        imageUrl = uploadRes.url || uploadRes.data?.url;
      }

      const cleanPhone = (formData.phone || '').trim().replace(/[\s\-\(\)]/g, '');
      const cleanEmail = (formData.email || '').trim();

      const payload = {
        businessName: (formData.business_name || '').trim(),
        businessEmail: cleanEmail || undefined,
        businessPhone: cleanPhone,
        city: (formData.district || '').trim() || undefined,
        vendorType: formData.vendor_type,
        businessAddress: {
          street: '',
          city: (formData.district || '').trim(),
          state: '',
          country: 'India',
          zipCode: (formData.pincode || '').trim()
        },
        portfolioImages: imageUrl ? [imageUrl] : undefined
      };

      await updateVendorProfile(payload);
      if (formData.owner_name?.trim()) {
        try {
          await updateProfile({ name: formData.owner_name.trim() });
        } catch (_) {}
      }
      toast.success('Registration successful!');
      onSuccess();
    } catch (err: any) {
      console.error('Failed to register vendor:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to submit registration form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-100 text-gray-800 rounded-3xl min-h-[600px] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full mx-auto px-6 py-10 bg-white shadow-2xl rounded-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-center text-indigo-700">Register as a Verified Vendor</h1>
        <p className="text-center text-gray-600 mb-10">Join the Airion Solutions platform and grow your business with trusted leads and premium visibility.</p>

        <form className="space-y-6 text-left" onSubmit={handleSubmit}>
          {/* Business Details */}
          <div>
            <label className="block font-semibold text-sm">Business/Brand Name</label>
            <input type="text" name="business_name" value={formData.business_name} onChange={handleChange} placeholder="e.g., Royal Banquets" required
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Owner Details */}
          <div>
            <label className="block font-semibold text-sm">Owner/Manager Full Name</label>
            <input type="text" name="owner_name" value={formData.owner_name} onChange={handleChange} placeholder="e.g., Abhishek Kumar" required
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Contact Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-sm">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g., +91 98765 43210" required
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block font-semibold text-sm">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@email.com" required
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Business Type */}
          <div>
            <label className="block font-semibold text-sm">Type of Vendor/Service</label>
            <select name="vendor_type" value={formData.vendor_type} onChange={handleChange} required
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="" disabled>Select your category</option>
              <option value="Banquet Hall">Banquet Hall</option>
              <option value="Caterer">Caterer</option>
              <option value="Photographer">Photographer</option>
              <option value="Makeup Artist">Makeup Artist</option>
              <option value="DJ & Music">DJ & Music</option>
              <option value="Decorator">Decorator</option>
              <option value="Sweet Shop">Sweet Shop</option>
              <option value="Venue Owner">Venue Owner</option>
              <option value="Florist">Florist</option>
              <option value="Lighting & Sound">Lighting & Sound</option>
              <option value="Event Planner">Event Planner</option>
              <option value="Invitation Designer">Invitation Designer</option>
              <option value="Costume Rental">Costume Rental</option>
              <option value="Mehendi Artist">Mehendi Artist</option>
              <option value="Choreographer">Choreographer</option>
              <option value="Security Service">Security Service</option>
              <option value="Transport & Cab">Transport & Cab</option>
              <option value="Hotel/Resort Partner">Hotel/Resort Partner</option>
              <option value="Anchor/Emcee">Anchor/Emcee</option>
              <option value="Drone Photography">Drone Photography</option>
              <option value="Live Streaming Service">Live Streaming Service</option>
              <option value="Stage Designer">Stage Designer</option>
              <option value="Bartender & Beverage Services">Bartender & Beverage Services</option>
              <option value="Rental Furniture & Props">Rental Furniture & Props</option>
              <option value="Return Gift Providers">Return Gift Providers</option>
              <option value="Food Truck/Live Counter">Food Truck/Live Counter</option>
              <option value="Fireworks Supplier">Fireworks Supplier</option>
              <option value="Priest / Purohit">Priest / Purohit</option>
              <option value="Destination Wedding Organizer">Destination Wedding Organizer</option>
              <option value="Other Services">Other Services</option>
            </select>
          </div>

          {/* Location */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-sm">District</label>
              <input type="text" name="district" value={formData.district} onChange={handleChange} placeholder="e.g., Patna" required
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block font-semibold text-sm">Pin Code</label>
              <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="e.g., 800001" required
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Upload Documents */}
          <div>
            <label className="block font-semibold text-sm">Upload Business Logo / Banner (optional)</label>
            <input type="file" name="business_file" onChange={handleChange}
              className="mt-2 block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0 file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start">
            <input type="checkbox" name="terms" checked={formData.terms} onChange={handleChange} required id="terms" className="h-5 w-5 text-indigo-600 mt-1 cursor-pointer" />
            <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
              I have read and agree to the 
              <a href="#" className="text-indigo-600 underline ml-1">Terms & Conditions</a> and 
              <a href="#" className="text-indigo-600 underline ml-1">Vendor Agreement</a>.
            </label>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button type="submit" disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-md hover:shadow-lg transition duration-300 disabled:opacity-70">
              {loading ? 'Submitting...' : '🚀 Register Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
