import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function IssueImage({ issueId, alt, className = '' }) {
  const [imageUrl, setImageUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl;

    api.getIssueImage(issueId)
      .then((image) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(image);
        setImageUrl(objectUrl);
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load issue image.');
        }
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [issueId]);

  if (errorMessage) {
    return <p role="alert" className="text-sm text-red-700">Unable to load the issue image.</p>;
  }

  if (!imageUrl) {
    return <p role="status" className="text-sm text-slate-500">Loading issue image…</p>;
  }

  return <img src={imageUrl} alt={alt} className={className} />;
}
