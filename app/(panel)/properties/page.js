"use client";

import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { Camera, Edit, LucideImage, Plus, Trash2, Upload } from "lucide-react";
import Modal from "@/components/modal";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

function ConvexImage({ storageId, className }) {
  const url = useQuery(api.properties.getImageUrl, storageId ? { storageId } : "skip");
  
  if (!storageId) return null;
  if (!url) return <div className={`animate-pulse bg-gray-200 ${className}`} />;
  
  return <img src={url} alt="Preview" className={`object-cover ${className}`} />;
}

const blankForm = {
  propertyNumber: "",
  ward: "",
  mobile: "",
  ownerName: "",
  ownerPhotoId: "",
  propertyType: "Residential",
  usageType: "Residential",
  constructionType: "RCC",
  numberOfFloors: 1,
  constructionYear: 2020,
  occupancyStatus: "Owner Occupied",
  status: "active",
  address: "",
  city: "",
  state: "",
  pincode: "",
  totalArea: 0,
  builtUpArea: 0,
  latitude: "28.6139",
  longitude: "77.2090",
  propertyPhotoIds: [],
  remarks: ""
};

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const ownerPhotoRef = useRef(null);
  const propertyPhotosRef = useRef(null);

  const session = useStoredSession();
  const wards = useQuery(api.wards.list, session?.token ? { token: session.token, search: "" } : "skip") || [];
  const properties = useQuery(api.properties.listProperties, session?.token ? { token: session.token, search } : "skip") || [];
  const citizenLookup = useQuery(
    api.properties.lookupCitizenByPhone,
    session?.token && form.mobile.trim() ? { token: session.token, phone: form.mobile } : "skip"
  );

  const createProperty = useMutation(api.properties.create);
  const updateProperty = useMutation(api.properties.update);
  const deleteProperty = useMutation(api.properties.remove);
  const generateUploadUrl = useMutation(api.properties.generateUploadUrl);

  useEffect(() => {
    if (!open || editing || !citizenLookup) return;
    if (citizenLookup.citizenExists && citizenLookup.name && form.ownerName !== citizenLookup.name) {
      setForm((prev) => ({ ...prev, ownerName: citizenLookup.name }));
    }
  }, [citizenLookup, editing, form.ownerName, open]);

  const uploadFile = async (file) => {
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      return storageId;
    } catch (error) {
      console.error("Upload failed", error);
      return null;
    }
  };

  const handleOwnerPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const storageId = await uploadFile(file);
    if (storageId) setForm(prev => ({ ...prev, ownerPhotoId: storageId }));
    setIsUploading(false);
  };

  const handlePropertyPhotosChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    const ids = [];
    for (const file of files) {
      const id = await uploadFile(file);
      if (id) ids.push(id);
    }
    setForm(prev => ({ ...prev, propertyPhotoIds: [...(prev.propertyPhotoIds || []), ...ids] }));
    setIsUploading(false);
  };

  const submit = async (event) => {
    if (event) event.preventDefault();
    setFormError("");

    if (!form.ward) {
      setFormError("Please select a ward before saving the property.");
      return;
    }

    try {
      const payload = {
        ...form,
        numberOfFloors: Number(form.numberOfFloors),
        constructionYear: Number(form.constructionYear),
        totalArea: Number(form.totalArea),
        builtUpArea: Number(form.builtUpArea),
      };

      if (editing) {
        await updateProperty({ token: session.token, propertyDocId: editing.id, ...payload });
      } else {
        await createProperty({ token: session.token, ...payload });
      }
      setOpen(false);
      setEditing(null);
      setForm(blankForm);
    } catch (err) {
      setFormError(err.message || "Failed to save property");
    }
  };

  return (
    <div className="space-y-6">
      <div className="ds-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="ds-page-title">Property Management</h1>
          <p className="ds-page-subtitle">Comprehensive property lifecycle management with documentation and geo-mapping.</p>
        </div>
        <button
          className="btn btn-primary shadow-lg shadow-primary-200"
          onClick={() => {
            setEditing(null);
            setForm(blankForm);
            setFormError("");
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Create Property
        </button>
      </div>

      <div className="card-flat">
        <input
          className="input"
          placeholder="Search by ID, owner, mobile, ward or address..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="card overflow-hidden p-0 shadow-xl shadow-slate-200/50">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Property Ledger</h2>
        </div>
        <div className="table-wrap rounded-none border-0">
          <table className="table">
            <thead>
              <tr className="bg-gray-50/30">
                <th>Property ID</th>
                <th>Owner Name</th>
                <th>Mobile</th>
                <th>Address</th>
                <th>Ward</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">No properties found.</td>
                </tr>
              ) : properties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="font-bold text-primary-900">{property.propertyId}</td>
                  <td>
                    <div className="flex items-center gap-2">
                       <span className="font-medium text-gray-900">{property.ownerName}</span>
                    </div>
                  </td>
                  <td className="text-gray-600 font-mono text-xs">{property.mobile}</td>
                  <td className="max-w-xs truncate text-gray-500">{property.address}</td>
                  <td>
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {property.wardDetails?.wardNumber || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span className={property.status === "active" ? "badge badge-success" : "badge badge-danger"}>
                      {property.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditing(property);
                          setForm({
                            propertyNumber: property.propertyNumber || "",
                            ownerName: property.ownerName,
                            mobile: property.mobile,
                            ownerPhotoId: property.ownerPhotoId || "",
                            propertyType: property.propertyType || "Residential",
                            usageType: property.usageType || "Residential",
                            constructionType: property.constructionType || "RCC",
                            numberOfFloors: property.numberOfFloors || 1,
                            constructionYear: property.constructionYear || 2020,
                            occupancyStatus: property.occupancyStatus || "Owner Occupied",
                            status: property.status,
                            address: property.address,
                            city: property.city || "",
                            state: property.state || "",
                            pincode: property.pincode || "",
                            totalArea: property.totalArea || 0,
                            builtUpArea: property.builtUpArea || 0,
                            latitude: property.latitude || "28.6139",
                            longitude: property.longitude || "77.2090",
                            propertyPhotoIds: property.propertyPhotoIds || [],
                            remarks: property.remarks || "",
                            ward: property.ward,
                          });
                          setFormError("");
                          setOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this property?")) {
                            await deleteProperty({ token: session.token, propertyDocId: property.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title={editing ? "Edit Property Profile" : "Onboard New Property"}
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="max-w-4xl"
        footer={
          <div className="flex w-full justify-between items-center px-2">
            <p className="text-xs text-gray-400">Fields marked with * are mandatory</p>
            <div className="flex gap-3">
              <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={isUploading}>
                {isUploading ? "Uploading..." : editing ? "Update Property" : "Create Property"}
              </button>
            </div>
          </div>
        }
      >
        <form className="space-y-8 py-2" onSubmit={submit}>
          {/* Basic Information */}
          <section className="space-y-4">
            <h3 className="flex items-center text-sm font-bold text-gray-900 border-l-4 border-primary-500 pl-3">
              <Plus className="mr-2 h-4 w-4 text-primary-500" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="label">Property Number</label>
                  <input className="input" placeholder="Property Number" value={form.propertyNumber} onChange={(e) => setForm(p => ({ ...p, propertyNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Ward *</label>
                  <select className="input" value={form.ward} onChange={(e) => setForm(p => ({ ...p, ward: e.target.value }))} required>
                    <option value="">Select Ward</option>
                    {wards.map(w => <option key={w.id} value={w.id}>{w.wardNumber} - {w.wardName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Owner Phone *</label>
                  <input className="input" value={form.mobile} onChange={(e) => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="+91 1234567890" required />
                </div>
                <div>
                  <label className="label">Owner Name *</label>
                  <input className="input" value={form.ownerName} onChange={(e) => setForm(p => ({ ...p, ownerName: e.target.value }))} placeholder="Owner Full Name" required />
                </div>
              </div>

              {/* Owner Photo Upload */}
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 flex flex-col items-center justify-center space-y-4 transition-colors hover:border-primary-300">
                <div className="ds-avatar-ring p-1">
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {form.ownerPhotoId ? (
                       <ConvexImage storageId={form.ownerPhotoId} className="h-full w-full" />
                    ) : (
                       <Camera className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-xs font-bold text-gray-700">Owner Photo / Document</h4>
                </div>
                <div className="flex gap-2">
                  <input type="file" ref={ownerPhotoRef} className="hidden" accept="image/*" onChange={handleOwnerPhotoChange} />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => ownerPhotoRef.current?.click()}>
                    <Upload className="h-3 w-3 mr-1" /> Choose File
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm">
                    <Camera className="h-3 w-3 mr-1" /> Camera
                  </button>
                </div>
                {form.ownerPhotoId && <p className="text-[10px] text-emerald-600 font-medium">Attachment Ready: {form.ownerPhotoId.substring(0, 10)}...</p>}
              </div>
            </div>
          </section>

          {/* Property Details */}
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="flex items-center text-sm font-bold text-gray-900 border-l-4 border-indigo-500 pl-3">
              <Edit className="mr-2 h-4 w-4 text-indigo-500" />
              Property Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="label">Property Type *</label>
                <select className="input" value={form.propertyType} onChange={e => setForm(p => ({ ...p, propertyType: e.target.value }))}>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Institutional">Institutional</option>
                </select>
              </div>
              <div>
                <label className="label">Usage Type</label>
                <select className="input" value={form.usageType} onChange={e => setForm(p => ({ ...p, usageType: e.target.value }))}>
                  <option value="Residential">Residential</option>
                  <option value="Shop">Shop</option>
                  <option value="Office">Office</option>
                </select>
              </div>
              <div>
                <label className="label">Construction Type</label>
                <select className="input" value={form.constructionType} onChange={e => setForm(p => ({ ...p, constructionType: e.target.value }))}>
                  <option value="RCC">RCC</option>
                  <option value="Semi-Permanent">Semi-Permanent</option>
                  <option value="Kutcha">Kutcha</option>
                </select>
              </div>
              <div>
                <label className="label">Number of Floors</label>
                <input type="number" className="input" value={form.numberOfFloors} onChange={e => setForm(p => ({ ...p, numberOfFloors: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Construction Year</label>
                <input type="number" className="input" value={form.constructionYear} onChange={e => setForm(p => ({ ...p, constructionYear: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Occupancy Status</label>
                <select className="input" value={form.occupancyStatus} onChange={e => setForm(p => ({ ...p, occupancyStatus: e.target.value }))}>
                  <option value="Owner Occupied">Owner Occupied</option>
                  <option value="Tenant">Tenant</option>
                  <option value="Vacant">Vacant</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="flex items-center text-sm font-bold text-gray-900 border-l-4 border-emerald-500 pl-3">
              <Camera className="mr-2 h-4 w-4 text-emerald-500" />
              Address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Address *</label>
                <textarea className="input h-20 py-2" placeholder="Complete address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">City *</label>
                  <input className="input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">State *</label>
                  <input className="input" value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Pincode *</label>
                  <input className="input" value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))} required />
                </div>
              </div>
            </div>
          </section>

          {/* Area Info */}
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="flex items-center text-sm font-bold text-gray-900 border-l-4 border-rose-500 pl-3">
              <Edit className="mr-2 h-4 w-4 text-rose-500" />
              Area Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
               <div>
                  <label className="label">Total Area (sq. meters) *</label>
                  <input type="number" className="input" value={form.totalArea} onChange={e => setForm(p => ({ ...p, totalArea: Number(e.target.value) }))} required />
               </div>
               <div>
                  <label className="label">Built-up Area (sq. meters)</label>
                  <input type="number" className="input" value={form.builtUpArea} onChange={e => setForm(p => ({ ...p, builtUpArea: Number(e.target.value) }))} />
               </div>
            </div>
          </section>

          {/* Geolocation */}
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="flex items-center text-sm font-bold text-gray-900 border-l-4 border-sky-500 pl-3">
              <Plus className="mr-2 h-4 w-4 text-sky-500" />
              Geolocation (Optional)
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
               <div>
                  <label className="label">Latitude</label>
                  <input className="input" value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} />
               </div>
               <div>
                  <label className="label">Longitude</label>
                  <input className="input" value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} />
               </div>
            </div>
          </section>

          {/* Photos */}
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center text-sm font-bold text-gray-900 border-l-4 border-violet-500 pl-3">
                <LucideImage className="mr-2 h-4 w-4 text-violet-500" />
                Property Photos *
              </h3>
              <span className="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded font-bold uppercase">Required</span>
            </div>
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <input type="file" ref={propertyPhotosRef} className="hidden" multiple accept="image/*" onChange={handlePropertyPhotosChange} />
                 <button type="button" className="btn btn-primary btn-sm" onClick={() => propertyPhotosRef.current?.click()} disabled={isUploading}>
                   <Upload className="h-3 w-3 mr-1" /> Choose File
                 </button>
               </div>
                <div className="flex flex-wrap gap-2">
                  {form.propertyPhotoIds?.map((id, index) => (
                    <div key={id} className="relative group">
                      <div className="h-16 w-16 rounded border bg-gray-50 flex items-center justify-center overflow-hidden">
                         <ConvexImage storageId={id} className="h-full w-full" />
                      </div>
                      <button type="button" onClick={() => setForm(p => ({ ...p, propertyPhotoIds: p.propertyPhotoIds.filter((_, i) => i !== index) }))} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
            </div>
          </section>

          {/* Remarks */}
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="flex items-center text-sm font-bold text-gray-900 border-l-4 border-gray-500 pl-3">
              <Edit className="mr-2 h-4 w-4 text-gray-500" />
              Remarks
            </h3>
            <textarea className="input h-20 py-2" placeholder="Any additional notes..." value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
          </section>

          {formError ? (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
               <p className="text-sm text-red-700 font-medium">{formError}</p>
            </div>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}
