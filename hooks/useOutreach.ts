import { useState, useEffect } from 'react';
import { OutreachRecord, OutreachStatus, Business } from '../types';

const STORAGE_KEY = 'localbiz_outreach_records';

export const useOutreach = () => {
  const [records, setRecords] = useState<OutreachRecord[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setRecords(JSON.parse(stored));
    }
  }, []);

  const saveRecord = (record: OutreachRecord) => {
    setRecords((prev) => {
      const existingIndex = prev.findIndex(r => r.businessId === record.businessId);
      let newRecords;
      if (existingIndex >= 0) {
        newRecords = [...prev];
        newRecords[existingIndex] = record;
      } else {
        newRecords = [record, ...prev];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
      return newRecords;
    });
  };

  const getRecord = (businessId: string) => {
    return records.find(r => r.businessId === businessId);
  };

  const updateStatus = (businessId: string, status: OutreachStatus, channel?: 'whatsapp' | 'email' | 'call') => {
    const record = getRecord(businessId);
    if (record) {
      saveRecord({
        ...record,
        status,
        lastUpdated: Date.now(),
        channel: channel || record.channel
      });
    }
  };

  return { records, saveRecord, getRecord, updateStatus };
};