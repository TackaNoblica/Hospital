import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081';

export default function PatientPage() {
  const [patient, setPatient] = useState(null);
  const [temperature, setTemperature] = useState('');
  const [painLevel, setPainLevel] = useState('');
  const [nausea, setNausea] = useState(false);
  const [bleeding, setBleeding] = useState(false);
  const [breathingProblem, setBreathingProblem] = useState(false);
  const [woundRedness, setWoundRedness] = useState(false);
  const [generalWorsening, setGeneralWorsening] = useState(false);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('careafterToken');
    if (!token) {
      window.location.href = '/';
      return;
    }

    axios.get(`${API_BASE_URL}/api/patients/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => setPatient(response.data))
      .catch(() => {
        setMessage('Failed to load patient profile');
      });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!patient) {
      setMessage('Patient profile not loaded yet.');
      return;
    }

    const token = localStorage.getItem('careafterToken');
    try {
      await axios.post(`${API_BASE_URL}/api/symptom-checkins/patient/${patient.id}`, {
        temperature: Number(temperature),
        painLevel: Number(painLevel),
        nausea,
        bleeding,
        breathingProblem,
        woundRedness,
        generalWorsening,
        comment,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Symptom check-in submitted');
    } catch (error) {
      setMessage('Failed to send symptom check-in');
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
      <h1>Patient check-in</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Temperature</label>
          <input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} required />
        </div>
        <div>
          <label>Pain level</label>
          <input type="number" min="1" max="10" value={painLevel} onChange={(e) => setPainLevel(e.target.value)} required />
        </div>
        <div>
          <label>
            <input type="checkbox" checked={nausea} onChange={(e) => setNausea(e.target.checked)} /> Nausea
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" checked={bleeding} onChange={(e) => setBleeding(e.target.checked)} /> Bleeding
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" checked={breathingProblem} onChange={(e) => setBreathingProblem(e.target.checked)} /> Difficulty breathing
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" checked={woundRedness} onChange={(e) => setWoundRedness(e.target.checked)} /> Wound redness
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" checked={generalWorsening} onChange={(e) => setGeneralWorsening(e.target.checked)} /> General worsening
          </label>
        </div>
        <div>
          <label>Comment</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="3" />
        </div>
        <button type="submit" disabled={!patient}>Submit</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
