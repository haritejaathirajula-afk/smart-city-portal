import React from 'react';
import { Building2, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-400 border-t border-navy-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white shadow-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white">Smart City Service Portal</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering citizens and municipal administration to collaborate seamlessly for cleaner, safer, and responsive urban governance.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-950/60 border border-teal-800/60 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-semibold">Verified Municipal Platform</span>
            </div>
          </div>

          {/* Citizen Services */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Citizen Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/report" className="hover:text-teal-400 transition-colors">Report Potholes or Road Damage</Link></li>
              <li><Link to="/report" className="hover:text-teal-400 transition-colors">Broken Streetlight & Cables</Link></li>
              <li><Link to="/report" className="hover:text-teal-400 transition-colors">Garbage & Solid Waste Cleanup</Link></li>
              <li><Link to="/services" className="hover:text-teal-400 transition-colors">Water Tanker & Drainage Service</Link></li>
              <li><Link to="/complaints" className="hover:text-teal-400 transition-colors">Track Complaint by Token</Link></li>
            </ul>
          </div>

          {/* Administration & Transparency */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Municipal Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/officer" className="hover:text-teal-400 transition-colors">Officer Dispatch Terminal</Link></li>
              <li><Link to="/admin" className="hover:text-teal-400 transition-colors">Administrator Central Console</Link></li>
              <li><Link to="/alerts" className="hover:text-teal-400 transition-colors">Emergency Broadcast Feed</Link></li>
              <li><Link to="/analytics" className="hover:text-teal-400 transition-colors">City Performance Metrics</Link></li>
              <li><Link to="/map" className="hover:text-teal-400 transition-colors">Geospatial GIS Grievance Map</Link></li>
            </ul>
          </div>

          {/* Emergency Contacts */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Emergency Hotlines
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-white font-semibold">City Helpline: 112 / 100</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Control Room: 1800-11-2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>support@smartcity.gov.local</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Civic Centre, Central Municipal Plaza</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-navy-900 text-xs flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Smart City Service Portal. Academic Demonstration Platform.
          </div>
          <div className="flex items-center gap-1.5">
            <span>Powered by</span>
            <span className="text-slate-300 font-medium">React 18 &bull; Express &bull; MySQL 8 &bull; Leaflet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
