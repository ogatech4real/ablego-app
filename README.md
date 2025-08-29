# AbleGo - Inclusive Transport with Compassion

A comprehensive transport booking platform with Google Places Autocomplete integration for enhanced address input.

## 🚨 **SECURITY ALERT - IMPORTANT SETUP**

### **Google Maps API Key Setup**

1. **Get a new API key** from [Google Cloud Console](https://console.cloud.google.com/)
2. **Create a `.env` file** in the `project/` directory
3. **Add your API key**:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_new_api_key_here
   ```
4. **Set API key restrictions** in Google Cloud Console:
   - HTTP referrers: Your domain
   - API restrictions: Maps JavaScript API, Places API, Geocoding API

### **Environment Variables**

Create a `.env` file in the `project/` directory with:

```env
# Google Maps API Key (REQUIRED)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=AbleGo
```

## 🚀 **Features**

- ✅ **Google Places Autocomplete** - Real-time address suggestions
- ✅ **UK Address Validation** - Only accepts UK addresses
- ✅ **Current Location Detection** - GPS-based location
- ✅ **Multi-stop Booking** - Support for intermediate stops
- ✅ **Real-time Pricing** - Dynamic fare calculation
- ✅ **Guest Booking System** - No account required
- ✅ **Admin Dashboard** - Complete booking management
- ✅ **Responsive Design** - Mobile-first approach

## 🛠 **Tech Stack**

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Maps**: Google Maps API + Places API
- **Payments**: Stripe Integration
- **Deployment**: Netlify

## 📦 **Installation**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ogatech4real/ablego-app.git
   cd ablego-app/project
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** (see above)

4. **Start development server**:
   ```bash
   npm run dev
   ```

## 🔧 **Development**

### **Available Scripts**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### **Database Setup**

1. **Link to Supabase project**:
   ```bash
   npx supabase link --project-ref your_project_ref
   ```

2. **Push migrations**:
   ```bash
   npx supabase db push
   ```

3. **Deploy functions**:
   ```bash
   npx supabase functions deploy create-guest-booking
   ```

## 🔒 **Security Best Practices**

- ✅ **Never commit API keys** to version control
- ✅ **Use environment variables** for all sensitive data
- ✅ **Set API key restrictions** in Google Cloud Console
- ✅ **Enable CORS** for your domains only
- ✅ **Use HTTPS** in production
- ✅ **Regular security audits** of dependencies

## 🌐 **Deployment**

### **Netlify Deployment**

1. **Connect repository** to Netlify
2. **Set build settings**:
   - Build command: `cd project && npm run build`
   - Publish directory: `project/dist`
3. **Add environment variables** in Netlify dashboard
4. **Deploy**

### **Environment Variables for Production**

Set these in your deployment platform:

- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📱 **Testing**

### **Address Input Testing**

1. **Type in address fields** to see autocomplete
2. **Test UK address validation**
3. **Use current location button**
4. **Complete a test booking**

### **API Key Testing**

1. **Check browser console** for API key warnings
2. **Verify Google Maps loads** correctly
3. **Test Places Autocomplete** functionality

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

## 🆘 **Support**

For support, please contact the development team or create an issue in the repository.

---

**⚠️ REMEMBER**: Always keep your API keys secure and never commit them to version control!
