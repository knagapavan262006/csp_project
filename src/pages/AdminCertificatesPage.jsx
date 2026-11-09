import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getAllCertificates } from '../services/certificateService';
import StatusBadge from '../components/StatusBadge';
import { ACHIEVEMENT_CATEGORIES, ACADEMIC_YEARS, BRANCHES } from '../utils/constants';
import { formatDate } from '../utils/helpers';

export default function AdminCertificatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [certificates, setCertificates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const statusFilter = searchParams.get('status') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const data = await getAllCertificates();
        setCertificates(data);
      } catch (error) {
        console.error(error);
        setError(error.message || 'Unable to load certificates.');
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, []);

  const filteredCertificates = useMemo(() => {
    const query = search.toLowerCase().trim();
    return certificates.filter((certificate) => {
      const title = certificate.certificateTitle || certificate.title || '';
      const organization = certificate.issuingOrganization || certificate.organization || '';
      const branch = certificate.department || certificate.branch || '';
      const year = certificate.academicYear || certificate.year || '';
      const category = certificate.category || '';
      const status = String(certificate.status || 'pending').toLowerCase();

      const matchesSearch = !query ||
        (certificate.rollNumber || '').toLowerCase().includes(query) ||
        (certificate.studentName || '').toLowerCase().includes(query) ||
        title.toLowerCase().includes(query) ||
        organization.toLowerCase().includes(query);
      const matchesBranch = !branchFilter || branch === branchFilter;
      const matchesYear = !yearFilter || year === yearFilter;
      const matchesCategory = !categoryFilter || category === categoryFilter;
      const matchesStatus = !statusFilter || status === statusFilter;

      return matchesSearch && matchesBranch && matchesYear && matchesCategory && matchesStatus;
    });
  }, [certificates, search, branchFilter, yearFilter, categoryFilter, statusFilter]);

  const toggleSelection = (certificateId) => {
    setSelected((current) =>
      current.includes(certificateId)
        ? current.filter((item) => item !== certificateId)
        : [...current, certificateId],
    );
  };

  const toggleAll = () => {
    const visibleIds = filteredCertificates.map((item) => item.id);
    const allVisibleSelected = visibleIds.every((id) => selected.includes(id));
    setSelected((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }
      return [...new Set([...current, ...visibleIds])];
    });
  };

  const clearFilters = () => {
    setSearch('');
    setBranchFilter('');
    setYearFilter('');
    setCategoryFilter('');
    setSearchParams({});
  };

  const handleDownloadSelected = async () => {
    if (!selected.length) return;

    const zip = new JSZip();
    const selectedCertificates = certificates.filter((certificate) => selected.includes(certificate.id));

    for (const certificate of selectedCertificates) {
      try {
        const response = await fetch(certificate.fileURL || certificate.fileUrl);
        const blob = await response.blob();
        const title = certificate.certificateTitle || certificate.title || 'certificate';
        const safeName = `${certificate.rollNumber || 'student'}_${title.replace(/[^a-z0-9-_]+/gi, '_')}${getFileExtension(certificate.fileName || certificate.fileURL || certificate.fileUrl)}`;
        zip.file(safeName, blob);
      } catch (error) {
        console.error('Download failed for certificate', certificate.id, error);
      }
    }

    const archive = await zip.generateAsync({ type: 'blob' });
    saveAs(archive, 'selected-certificates.zip');
  };

  const getFileExtension = (value) => {
    if (!value) return '.pdf';
    const extension = String(value).split('.').pop();
    return extension ? `.${extension}` : '.pdf';
  };

  if (loading) return <div className="page-loading">Loading certificates...</div>;

  return (
    <div className="page-block">
      <div className="page-header">
        <div>
          <p className="eyebrow">Certificate review</p>
          <h1>Certificates</h1>
        </div>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="toolbar-grid">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by roll number, student name, or title" />
        <select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
          <option value="">All branches</option>
          {BRANCHES.map((branch) => (<option key={branch} value={branch}>{branch}</option>))}
        </select>
        <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
          <option value="">All years</option>
          {ACADEMIC_YEARS.map((year) => (<option key={year} value={year}>{year}</option>))}
        </select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="">All categories</option>
          {ACHIEVEMENT_CATEGORIES.map((category) => (<option key={category} value={category}>{category}</option>))}
        </select>
        <select value={statusFilter} onChange={(event) => {
          const nextValue = event.target.value;
          if (nextValue) {
            setSearchParams({ status: nextValue });
          } else {
            setSearchParams({});
          }
        }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button type="button" className="secondary-btn" onClick={clearFilters}>Clear Filters</button>
      </div>

      <div className="bulk-actions">
        <label><input type="checkbox" checked={filteredCertificates.length > 0 && filteredCertificates.every((item) => selected.includes(item.id))} onChange={toggleAll} /> Select all visible</label>
        <div className="button-row compact-row">
          <button type="button" className="secondary-btn" onClick={handleDownloadSelected} disabled={!selected.length}>Download selected</button>
          <span>{selected.length} selected</span>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Roll Number</th>
              <th>Student</th>
              <th>Branch</th>
              <th>Year</th>
              <th>Achievement</th>
              <th>Category</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCertificates.length === 0 ? (
              <tr>
                <td colSpan="10" className="empty-state">
                  {error ? 'Certificates could not be loaded.' : 'No certificates match the current filters.'}
                </td>
              </tr>
            ) : (
              filteredCertificates.map((certificate) => {
                const title = certificate.certificateTitle || certificate.title || '—';
                const branch = certificate.department || certificate.branch || '—';
                const year = certificate.academicYear || certificate.year || '—';

                return (
                  <tr key={certificate.id}>
                    <td><input type="checkbox" checked={selected.includes(certificate.id)} onChange={() => toggleSelection(certificate.id)} /></td>
                    <td>{certificate.rollNumber}</td>
                    <td>{certificate.studentName}</td>
                    <td>{branch}</td>
                    <td>{year}</td>
                    <td>{title}</td>
                    <td>{certificate.category}</td>
                    <td>{formatDate(certificate.achievementDate)}</td>
                    <td><StatusBadge status={certificate.status} /></td>
                    <td>
                      <Link to={`/admin/certificates/${certificate.id}`} className="text-link">View</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
