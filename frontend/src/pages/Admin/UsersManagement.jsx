import React, { useState, useEffect } from 'react';
import { Shield, ShieldOff, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminSearchBar from './shared/AdminSearchBar';
import AdminPagination from './shared/AdminPagination';
import { formatDate } from '../../utils/date';

const API   = 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

// ── Shared dialog shell ───────────────────────────────────────────────────────
function ConfirmDialog({ title, body, confirmLabel, confirmDanger, onConfirm, onCancel, submitting }) {
    const [hoverCancel,  setHoverCancel]  = useState(false);
    const [hoverConfirm, setHoverConfirm] = useState(false);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(45,31,20,0.45)', padding: '16px',
        }}>
            <div style={{
                backgroundColor: '#FFFAF7',
                border: '1px solid rgba(45,31,20,0.1)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(45,31,20,0.12)',
                width: '100%', maxWidth: '420px',
                padding: '24px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <AlertTriangle style={{ width: '18px', height: '18px', color: confirmDanger ? '#993C1D' : '#C07A4A', flexShrink: 0 }} />
                    <h3 style={{ fontFamily: serif, fontSize: '20px', fontWeight: 600, color: '#2D1F14', margin: 0 }}>
                        {title}
                    </h3>
                </div>
                <p style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.6, marginBottom: '20px' }}>
                    {body}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        onClick={onCancel}
                        disabled={submitting}
                        onMouseEnter={() => setHoverCancel(true)}
                        onMouseLeave={() => setHoverCancel(false)}
                        style={{
                            fontFamily: sans, fontSize: '12px', fontWeight: 500,
                            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                            border: '1px solid rgba(45,31,20,0.2)',
                            background: hoverCancel ? 'rgba(45,31,20,0.04)' : 'transparent',
                            color: '#7A5C44', opacity: submitting ? 0.5 : 1,
                            transition: 'background 0.12s',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={submitting}
                        onMouseEnter={() => setHoverConfirm(true)}
                        onMouseLeave={() => setHoverConfirm(false)}
                        style={{
                            fontFamily: sans, fontSize: '12px', fontWeight: 600,
                            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                            border: 'none',
                            background: confirmDanger
                                ? (hoverConfirm && !submitting ? '#7A2010' : '#993C1D')
                                : (hoverConfirm && !submitting ? '#1A4A2A' : 'rgba(45,31,20,0.85)'),
                            color: '#FAF7F4',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            opacity: submitting ? 0.6 : 1,
                            transition: 'background 0.12s',
                        }}
                    >
                        {submitting && <RefreshCw style={{ width: '13px', height: '13px' }} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
const UsersManagement = () => {
    const [users,         setUsers]         = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isLoading,     setIsLoading]     = useState(false);
    const [error,         setError]         = useState(null);
    const [searchTerm,    setSearchTerm]    = useState('');
    const [currentPage,   setCurrentPage]   = useState(1);
    const usersPerPage = 10;

    const [adminTarget,  setAdminTarget]  = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [submitting,   setSubmitting]   = useState(false);

    const [hoverRefresh, setHoverRefresh] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API}/users/admin`, { withCredentials: true });
            if (res.data.success) {
                setUsers(res.data.users);
            } else {
                setError('Failed to fetch users');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    useEffect(() => {
        const s = searchTerm.toLowerCase();
        setFilteredUsers(
            users.filter(u =>
                u.name?.toLowerCase().includes(s) ||
                u.email?.toLowerCase().includes(s)
            )
        );
        setCurrentPage(1);
    }, [searchTerm, users]);

    const start        = (currentPage - 1) * usersPerPage;
    const currentUsers = filteredUsers.slice(start, start + usersPerPage);

    const handleToggleAdmin = (user) => setAdminTarget(user);
    const handleDeleteClick = (user) => setDeleteTarget(user);

    const confirmToggleAdmin = async () => {
        setSubmitting(true);
        try {
            await axios.put(
                `${API}/users/admin/${adminTarget._id}/toggle-admin`,
                { isAdmin: !adminTarget.isAdmin },
                { withCredentials: true }
            );
            setUsers(prev => prev.map(u =>
                u._id === adminTarget._id ? { ...u, isAdmin: !adminTarget.isAdmin } : u
            ));
            toast.success(adminTarget.isAdmin ? 'Admin privileges revoked.' : 'Admin privileges granted.');
            setAdminTarget(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update admin status');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        setSubmitting(true);
        try {
            await axios.delete(
                `${API}/users/admin/${deleteTarget._id}`,
                { withCredentials: true }
            );
            setUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
            toast.success('User account deleted.');
            setDeleteTarget(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete user');
        } finally {
            setSubmitting(false);
        }
    };

    const COLS = ['#', 'Name', 'Email', 'Role', 'Joined', 'Actions'];

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h2 style={{ fontFamily: serif, fontSize: '24px', fontWeight: 700, color: '#2D1F14', margin: '0 0 4px' }}>
                        Users
                    </h2>
                    {filteredUsers.length > 0 && (
                        <p style={{ fontFamily: sans, fontSize: '12px', color: '#B09880', margin: 0 }}>
                            {filteredUsers.length} registered user{filteredUsers.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <AdminSearchBar
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search by name or email…"
                    />
                    <button
                        onClick={fetchUsers}
                        disabled={isLoading}
                        onMouseEnter={() => setHoverRefresh(true)}
                        onMouseLeave={() => setHoverRefresh(false)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontFamily: sans, fontSize: '12px', fontWeight: 500,
                            color: '#7A5C44', cursor: 'pointer',
                            border: '1px solid rgba(45,31,20,0.15)',
                            borderRadius: '6px', padding: '7px 14px',
                            background: hoverRefresh ? 'rgba(45,31,20,0.04)' : 'transparent',
                            transition: 'background 0.12s',
                            opacity: isLoading ? 0.5 : 1,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <RefreshCw style={{ width: '13px', height: '13px' }} className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(153,60,29,0.06)', border: '1px solid rgba(153,60,29,0.2)',
                    borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
                    fontFamily: sans, fontSize: '13px', color: '#993C1D',
                }}>
                    <AlertTriangle style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                    {error}
                </div>
            )}

            {/* Table */}
            <div style={{
                backgroundColor: '#FFFAF7',
                border: '1px solid rgba(45,31,20,0.1)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(45,31,20,0.06)',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans }}>
                    <thead>
                        <tr style={{ backgroundColor: 'rgba(45,31,20,0.03)', borderBottom: '1px solid rgba(45,31,20,0.1)' }}>
                            {COLS.map(h => (
                                <th key={h} style={{
                                    padding: '7px 10px', fontSize: '10px', fontWeight: 600,
                                    color: '#B09880', textTransform: 'uppercase', letterSpacing: '0.06em',
                                    textAlign: 'left', whiteSpace: 'nowrap',
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={COLS.length} style={{ padding: '48px', textAlign: 'center', fontFamily: sans, fontSize: '13px', color: '#B09880' }}>
                                    Loading…
                                </td>
                            </tr>
                        ) : currentUsers.length === 0 ? (
                            <tr>
                                <td colSpan={COLS.length} style={{ padding: '48px', textAlign: 'center', fontFamily: sans, fontSize: '13px', color: '#B09880' }}>
                                    {searchTerm ? 'No users match your search.' : 'No users found.'}
                                </td>
                            </tr>
                        ) : currentUsers.map((user, idx) => (
                            <UserRow
                                key={user._id}
                                user={user}
                                index={start + idx + 1}
                                onToggleAdmin={handleToggleAdmin}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filteredUsers.length > usersPerPage && (
                <div style={{ marginTop: '20px' }}>
                    <AdminPagination
                        itemsPerPage={usersPerPage}
                        totalItems={filteredUsers.length}
                        currentPage={currentPage}
                        paginate={setCurrentPage}
                    />
                </div>
            )}

            {/* Admin toggle dialog */}
            {adminTarget && (
                <ConfirmDialog
                    title={adminTarget.isAdmin ? 'Revoke admin privileges' : 'Grant admin privileges'}
                    body={
                        adminTarget.isAdmin
                            ? <>Revoke admin privileges from <strong>{adminTarget.name || adminTarget.email}</strong>? They will become a regular user.</>
                            : <>Grant admin privileges to <strong>{adminTarget.name || adminTarget.email}</strong>? They will be able to manage all content.</>
                    }
                    confirmLabel={adminTarget.isAdmin ? 'Revoke' : 'Grant'}
                    confirmDanger={false}
                    onConfirm={confirmToggleAdmin}
                    onCancel={() => setAdminTarget(null)}
                    submitting={submitting}
                />
            )}

            {/* Delete dialog */}
            {deleteTarget && (
                <ConfirmDialog
                    title="Delete user"
                    body={<>Permanently delete <strong>{deleteTarget.name || deleteTarget.email}</strong>? Their pet listings will be preserved. This cannot be undone.</>}
                    confirmLabel="Delete"
                    confirmDanger={true}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                    submitting={submitting}
                />
            )}
        </div>
    );
};

// ── Row ───────────────────────────────────────────────────────────────────────
function UserRow({ user, index, onToggleAdmin, onDelete }) {
    const [hover,        setHover]        = useState(false);
    const [hoverAdmin,   setHoverAdmin]   = useState(false);
    const [hoverDelete,  setHoverDelete]  = useState(false);

    const initial = (user.name || user.email || '?').charAt(0).toUpperCase();

    return (
        <tr
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                borderTop: '1px solid rgba(45,31,20,0.06)',
                background: hover ? 'rgba(192,122,74,0.03)' : 'transparent',
                transition: 'background 0.1s',
            }}
        >
            {/* # */}
            <td style={{ padding: '8px 10px', width: '36px' }}>
                <span style={{ fontFamily: sans, fontSize: '11px', color: '#B09880', fontWeight: 500 }}>{index}</span>
            </td>

            {/* Name */}
            <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: 'rgba(192,122,74,0.15)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: sans, fontSize: '11px', fontWeight: 700, color: '#7A5C44',
                    }}>
                        {initial}
                    </div>
                    <span style={{ fontFamily: sans, fontSize: '12px', fontWeight: 500, color: '#2D1F14' }}>
                        {user.name || '—'}
                    </span>
                </div>
            </td>

            {/* Email */}
            <td style={{ padding: '8px 10px' }}>
                <span style={{ fontFamily: sans, fontSize: '12px', color: '#7A5C44' }}>
                    {user.email}
                </span>
            </td>

            {/* Role */}
            <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontFamily: sans, fontSize: '10px', fontWeight: 600,
                    padding: '2px 8px', borderRadius: '100px',
                    background: user.isAdmin ? 'rgba(45,31,20,0.08)' : 'rgba(192,122,74,0.08)',
                    color: user.isAdmin ? '#2D1F14' : '#7A5C44',
                    border: user.isAdmin ? '1px solid rgba(45,31,20,0.15)' : '1px solid rgba(192,122,74,0.2)',
                }}>
                    {user.isAdmin ? 'Admin' : 'User'}
                </span>
            </td>

            {/* Joined */}
            <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                <span style={{ fontFamily: sans, fontSize: '11px', color: '#9A7A60' }}>
                    {formatDate(user.createdAt, 'short')}
                </span>
            </td>

            {/* Actions */}
            <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                        onClick={() => onToggleAdmin(user)}
                        onMouseEnter={() => setHoverAdmin(true)}
                        onMouseLeave={() => setHoverAdmin(false)}
                        title={user.isAdmin ? 'Revoke admin privileges' : 'Grant admin privileges'}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer',
                            border: '1px solid rgba(45,31,20,0.12)',
                            background: hoverAdmin ? 'rgba(45,31,20,0.06)' : 'transparent',
                            color: user.isAdmin ? '#2D1F14' : '#B09880',
                            transition: 'background 0.12s, color 0.12s',
                        }}
                    >
                        {user.isAdmin
                            ? <ShieldOff style={{ width: '13px', height: '13px' }} />
                            : <Shield   style={{ width: '13px', height: '13px' }} />}
                    </button>
                    <button
                        onClick={() => onDelete(user)}
                        onMouseEnter={() => setHoverDelete(true)}
                        onMouseLeave={() => setHoverDelete(false)}
                        title="Delete user"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer',
                            border: '1px solid rgba(153,60,29,0.2)',
                            background: hoverDelete ? 'rgba(153,60,29,0.06)' : 'transparent',
                            color: '#993C1D',
                            transition: 'background 0.12s',
                        }}
                    >
                        <Trash2 style={{ width: '13px', height: '13px' }} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default UsersManagement;
