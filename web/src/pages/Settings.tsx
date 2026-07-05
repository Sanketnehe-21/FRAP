import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Card, Button } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { Sliders, Shield, Mail } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const handleSaveSettings = () => {
    showToast('Platform configurations saved successfully', 'success');
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">System Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Configure global platform thresholds and security controls</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-blue-500" />
            <span>Theme Preferences</span>
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
            Configure the visual appearance of the FRAP Web Admin portal on your local browser.
          </p>
          <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <div>
              <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Interface Mode</span>
              <p className="text-xs text-zinc-400">Switch between light and dark themes</p>
            </div>
            <Button
              label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              variant="secondary"
              onClick={toggleTheme}
            />
          </div>
        </Card>

        {/* Global Security Policies */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-rose-500" />
            <span>API Security Thresholds (Mock)</span>
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Rate Limiting Threshold</span>
                <p className="text-xs text-zinc-400">Requests limit per minute per IP</p>
              </div>
              <select className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25">
                <option value="60">60 requests/min</option>
                <option value="120">120 requests/min (Default)</option>
                <option value="300">300 requests/min</option>
              </select>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Max Statement File Size</span>
                <p className="text-xs text-zinc-400">Maximum allowed document import size</p>
              </div>
              <select className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25">
                <option value="10">10 MB limit</option>
                <option value="25">25 MB limit (Default)</option>
                <option value="50">50 MB limit</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Global Onboarding Config */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-amber-500" />
            <span>Invitation Codes Configuration (Mock)</span>
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Invitation Link TTL</span>
                <p className="text-xs text-zinc-400">Expiration duration for member invite codes</p>
              </div>
              <select className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25">
                <option value="3">3 days</option>
                <option value="7">7 days (Default)</option>
                <option value="14">14 days</option>
              </select>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Strict Nicknames Enforcing</span>
                <p className="text-xs text-zinc-400">Forbid symbols and spacing in member nicknames</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500" />
            </div>
          </div>
        </Card>

        {/* Save button row */}
        <div className="lg:col-span-2 flex justify-end">
          <Button
            label="Save Configurations"
            onClick={handleSaveSettings}
            className="px-6 py-2.5 shadow"
          />
        </div>
      </div>
    </div>
  );
};
