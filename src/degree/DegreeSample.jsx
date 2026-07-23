import { useEffect, useState } from 'react';
import { Download, PencilLine, RotateCcw } from 'lucide-react';
import './degreeSample.css';

const defaults = {
  university: 'SUMMIT HILLS UNIVERSITY',
  location: 'Kuala Lumpur, Malaysia',
  serial: '004818',
  registration: 'SHU-2026-5691',
  roll: '115010',
  student: 'ALEX MORGAN',
  parent: 'JORDAN MORGAN',
  degree: 'BACHELOR OF ARTS',
  month: 'June, 2026',
  session: 'Spring 2026',
  grade: 'First',
  date: '22-07-2026',
};

function Field({ label, name, value, onChange }) {
  return <label className="degree-field">{label}<input name={name} value={value} onChange={onChange} /></label>;
}

function UniversitySeal() {
  return <div className="university-seal" aria-label="Decorative university seal">
    <span className="seal-star">★</span>
    <div className="seal-ring"><div className="seal-landscape"><span>SHU</span></div></div>
    <span className="seal-ribbon">KNOWLEDGE · SERVICE</span>
  </div>;
}

export default function DegreeSample() {
  const [data, setData] = useState(defaults);
  const [editing, setEditing] = useState(true);
  const update = (event) => setData((current) => ({ ...current, [event.target.name]: event.target.value }));
  useEffect(() => {
    document.title = 'Degree Certificate Sample | Client Preview';
  }, []);

  return <main className="degree-demo-shell">
    <header className="degree-toolbar">
      <div><span>Client preview</span><strong>Degree certificate sample</strong></div>
      <div className="degree-toolbar-actions">
        <button type="button" onClick={() => setEditing((value) => !value)}><PencilLine size={16} />{editing ? 'Hide editor' : 'Edit details'}</button>
        <button type="button" onClick={() => setData(defaults)}><RotateCcw size={16} />Reset</button>
        <button className="print-button" type="button" onClick={() => window.print()}><Download size={16} />Print / PDF</button>
      </div>
    </header>

    <div className={`degree-workspace ${editing ? '' : 'editor-hidden'}`}>
      {editing && <aside className="degree-editor">
        <h1>Certificate details</h1>
        <p>Update the sample information and preview changes instantly.</p>
        <div className="degree-fields">
          {Object.entries(data).map(([name, value]) => <Field key={name} label={name.replace(/([A-Z])/g, ' $1')} name={name} value={value} onChange={update} />)}
        </div>
      </aside>}

      <section className="certificate-stage" aria-label="Degree certificate preview">
        <article className="certificate">
          <div className="certificate-inner">
            <div className="sample-watermark">SAMPLE</div>
            <div className="certificate-topline">
              <p>Serial No. <strong>{data.serial}</strong></p>
              <div className="arabic-mark">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>
              <div><p>Registration No. <strong>{data.registration}</strong></p><p>Roll No. <strong>{data.roll}</strong></p></div>
            </div>

            <div className="certificate-title"><h2>{data.university}</h2><h3>{data.location}</h3></div>
            <UniversitySeal />

            <div className="certificate-copy">
              <p>The University, in recognition of the fulfilment of prescribed requirements, has conferred upon</p>
              <p><span className="line-value">{data.student}</span> Son / Daughter of <span className="line-value">{data.parent}</span></p>
              <p>The Degree of <strong className="degree-name">{data.degree}</strong> in the examination</p>
              <p>held in <span className="line-value short">{data.month}</span> session <span className="line-value">{data.session}</span></p>
              <p>He / She was placed in <span className="line-value short">{data.grade}</span> Division / Grade / CGPA.</p>
            </div>

            <div className="certificate-footer">
              <div className="gold-seal"><span>SAMPLE</span></div>
              <div className="signature-block"><span className="signature">A. Rahman</span><strong>Controller of Examinations</strong><small>Date <u>{data.date}</u></small></div>
              <div className="signature-block vice"><span className="signature">Nadia Karim</span><strong>Vice Chancellor</strong></div>
              <div className="signature-block"><span className="signature">M. Hassan</span><strong>Registrar</strong></div>
            </div>
            <div className="not-valid">DEMONSTRATION SAMPLE · NOT AN OFFICIAL DOCUMENT · NOT VALID</div>
          </div>
        </article>
      </section>
    </div>
  </main>;
}
