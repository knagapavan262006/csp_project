import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllStudents } from '../services/studentService';
import { getAllCertificates } from '../services/certificateService';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentData, certificateData] = await Promise.all([
          getAllStudents(),
          getAllCertificates(),
        ]);
        setStudents(studentData);
        setCertificates(certificateData);
      } catch (error) {
        console.error('Error loading students data:', error);
        setError(error.message || 'Unable to load student records.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const sortedStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students
      .map((student) => {
        const uid = student.uid || student.id;
        const count = certificates.filter(
          (cert) =>
            cert.studentId === uid ||
            cert.uid === uid ||
            (cert.rollNumber && student.rollNumber && cert.rollNumber === student.rollNumber)
        ).length;

        return { ...student, calculatedCertificatesCount: count };
      })
      .filter((student) => {
        const matchesSearch =
          !query ||
          student.name?.toLowerCase().includes(query) ||
          student.rollNumber?.toLowerCase().includes(query) ||
          student.email?.toLowerCase().includes(query);
        const matchesBranch = !branchFilter || student.branch === branchFilter;
        const matchesYear = !yearFilter || student.year === yearFilter;

        return matchesSearch && matchesBranch && matchesYear;
      })
      .sort((a, b) => (a.rollNumber || '').localeCompare(b.rollNumber || ''));
  }, [students, certificates, search, branchFilter, yearFilter]);

  if (loading) return <div className="page-loading">Loading students...</div>;

  if (error) {
    return (
      <div className="page-block">
        <div className="page-header">
          <div>
            <p className="eyebrow">Records</p>
            <h1>Students</h1>
          </div>
        </div>
        <div className="alert alert-error" role="alert">
          Could not load student records: {error}
        </div>
        <button type="button" className="secondary-btn" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="page-block">
      <div className="page-header">
        <div>
          <p className="eyebrow">Records</p>
          <h1>Students ({sortedStudents.length})</h1>
        </div>
      </div>

      <div className="toolbar-grid">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, roll number, or email" />
        <select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
          <option value="">All branches</option>
          <option value="CSE">CSE</option>
          <option value="IT">IT</option>
          <option value="ECE">ECE</option>
          <option value="EEE">EEE</option>
          <option value="Mechanical">Mechanical</option>
          <option value="Civil">Civil</option>
          <option value="Other">Other</option>
        </select>
        <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
          <option value="">All years</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll Number</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Branch</th>
              <th>Year</th>
              <th>Certificates</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">No student records found.</td>
              </tr>
            ) : (
              sortedStudents.map((student) => (
                <tr key={student.uid || student.id}>
                  <td><strong>{student.name || '—'}</strong></td>
                  <td>{student.rollNumber || '—'}</td>
                  <td>{student.email || '—'}</td>
                  <td>{student.phone || '—'}</td>
                  <td>{student.branch || '—'}</td>
                  <td>{student.year || '—'}</td>
                  <td><span className="badge">{student.calculatedCertificatesCount}</span></td>
                  <td>
                    <Link
                      to={`/admin/certificates?search=${encodeURIComponent(student.rollNumber || student.name || '')}`}
                      className="text-link"
                    >
                      View Certificates
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
