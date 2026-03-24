import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { Attachment } from '../api';

interface Props {
  transactionId: number;
  onClose: () => void;
}

export const AttachmentList: React.FC<Props> = ({ transactionId, onClose }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAttachments();
  }, [transactionId]);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      const data = await api.getAttachments(transactionId);
      setAttachments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      await api.uploadAttachment(transactionId, e.target.files[0]);
      await loadAttachments();
    } catch (err) {
      alert('Erreur lors de l\'envoi');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette pièce jointe ?')) return;
    try {
      await api.deleteAttachment(id);
      await loadAttachments();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content attachments-modal">
        <div className="modal-header">
          <h2>Pièces jointes</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="upload-section">
            <label className="btn btn-primary">
              {uploading ? 'Envoi...' : '📎 Ajouter un fichier'}
              <input 
                type="file" 
                hidden 
                onChange={handleFileUpload} 
                disabled={uploading} 
              />
            </label>
          </div>

          {loading ? (
            <div className="loading">Chargement...</div>
          ) : (
            <div className="attachments-grid">
              {attachments.length === 0 && <p className="empty-msg">Aucune pièce jointe</p>}
              {attachments.map(att => (
                <div key={att.id} className="attachment-card">
                  <div className="att-icon">📄</div>
                  <div className="att-info">
                    <span className="att-name">{att.file_name}</span>
                    <span className="att-date">{new Date(att.upload_date).toLocaleDateString()}</span>
                  </div>
                  <div className="att-actions">
                    <a 
                      href={api.getAttachmentUrl(att.id!)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn-icon"
                      title="Voir"
                    >
                      👁️
                    </a>
                    <button 
                      onClick={() => handleDelete(att.id!)} 
                      className="btn-icon delete"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
