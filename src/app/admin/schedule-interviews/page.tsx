'use client';

import Link from 'next/link';

export default function ScheduleInterviewsPage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Interviews</h1>
          <p className="text-gray-600">Use the Applications page to shortlist and schedule interviews.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/application-management" className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">Go to Applications</Link>
          <Link href="/admin/interview-calendar" className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">View Calendar</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 text-gray-700">
        From any application row, open Actions → <b>Schedule Interview</b>. After saving, the event appears in the Interview Calendar under the current user. Online interviews should include a Google Meet link.
      </div>
    </div>
  );
}
