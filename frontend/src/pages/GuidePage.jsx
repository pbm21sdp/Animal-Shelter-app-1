import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const SHELTERS = [
    { city: 'Alba Iulia',            name: 'Asociația Apuseni "Cats&Dogs"',                     contact: '0745 249 446 · animaapuseni@yahoo.com' },
    { city: 'Alexandria',            name: 'Protecția Animalelor Teleorman',                     contact: 'Facebook: "Protecția Animalelor Teleorman"' },
    { city: 'Arad',                  name: 'Asociația Animed Arad',                             contact: '0768 777 711 · animed@animed.ro' },
    { city: 'Arad',                  name: 'Asociația APAM Arad',                               contact: '0744 577 031 · apam_arad@yahoo.com' },
    { city: 'Bacău',                 name: 'Asociația Prieteni Necuvântători',                   contact: '0746 060 643 · prieteninecuvantatori@gmail.com' },
    { city: 'Baia Mare',             name: 'Asociația Salvați Animalele Maramureș',              contact: '0722 365 161 · mvalentin81@yahoo.com' },
    { city: 'Bârlad',                name: 'Asociația Help Azorel Bârlad',                      contact: '0766 287 924 · calinoiulucia@yahoo.com' },
    { city: 'Bistrița',              name: 'Asociația Animaterra Bistrița',                     contact: '0742 077 282 · animaterra@yahoo.com' },
    { city: 'Botoșani',              name: 'Asociația ADOR Botoșani',                           contact: '0740 146 927 · ador_botosani@yahoo.com' },
    { city: 'Brăila',                name: 'Asociația "Vreau să Fiu Liber"',                    contact: '0728 028 830 · libertis@libertis.ro' },
    { city: 'Brașov',                name: 'Asociația Milioane de Prieteni',                    contact: '0268 471 202 · milioanedeprieteni.org' },
    { city: 'București',             name: 'Asociația GIA (Group Initiative for Animals)',       contact: '0767 808 407 · office@gia.org.ro' },
    { city: 'București',             name: 'Asociația Robi',                                    contact: 'contact@4animals.ro' },
    { city: 'București / Ilfov',     name: 'Asociația Salvat la Timp',                          contact: '0726 527 202 · salvatlatimp@yahoo.com' },
    { city: 'Buzău',                 name: 'Asociația Prieteni Credincioși',                    contact: '0724 990 233 · rus_slv@yahoo.com' },
    { city: 'Călărași',              name: 'Save the Dogs — Adăpost Călărași',                  contact: 'calarasi@savethedogs.ro' },
    { city: 'Cluj-Napoca',           name: 'Asociația Arca lui Noe Cluj',                       contact: '0746 021 044 · arcaluinoe@yahoo.com' },
    { city: 'Cluj-Napoca',           name: 'Asociația NUCA Cluj',                               contact: '0744 547 066 · contact@nuca.org.ro' },
    { city: 'Constanța',             name: 'Save the Dogs (Gaia Animali Ambiente)',             contact: '0239 445 900 · office@savethedogs.eu' },
    { city: 'Craiova',               name: 'Asociația Viața Animalelor',                        contact: '0744 999 975 · viataanimalelor@yahoo.com' },
    { city: 'Deva',                  name: 'Asociația "Sufletel" Hunedoara',                    contact: '0745 959 364' },
    { city: 'Drobeta-Turnu Severin', name: 'Adăpostul Drobeta',                                 contact: '0252 315 383' },
    { city: 'Focșani',               name: 'Asociația Prietenii Animalelor Focșani',            contact: '0722 787 914 · valeria_lungu@yahoo.com' },
    { city: 'Galați',                name: 'Asociația ROLDA',                                   contact: '0748 903 612 · rolda@rolda.org' },
    { city: 'Giurgiu',               name: 'Asociația "Phoenyx" Giurgiu',                       contact: '0723 138 424 · phoenix_animale@yahoo.com' },
    { city: 'Iași',                  name: 'Asociația Clopețel Iași',                           contact: '0754 979 028' },
    { city: 'Iași',                  name: 'Asociația "Un suflet pentru fiecare"',              contact: '0746 407 513' },
    { city: 'Miercurea Ciuc',        name: 'Asociația Pro Animalia Harghita',                   contact: '0266 312 763 · proanimal@harghita.ro' },
    { city: 'Oradea',                name: 'Asociația Prietenii Pisicilor',                     contact: '0771 614 324 · prieteniipisicilor@yahoo.com' },
    { city: 'Piatra Neamț',          name: 'Asociația Prieten Credincios',                      contact: '0741 119 653 · office@prietencredincios.org.ro' },
    { city: 'Pitești',               name: 'Asociația AULIM (Iubiți Maidanezii)',               contact: '0733 929 351 · aulim@aulim.ro' },
    { city: 'Ploiești',              name: 'Asociația Brand Brigitte Ploiești',                 contact: '0751 066 780' },
    { city: 'Râmnicu Vâlcea',        name: 'Asociația "A Doua Șansă"',                          contact: '0722 923 889 · adouasansa.ro' },
    { city: 'Reșița',                name: 'Asociația Dog Center Reșița',                       contact: '0744 533 580 · office@dogscenter.ro' },
    { city: 'Satu Mare',             name: 'Asociația Freelife Satu Mare',                      contact: '0727 303 371 · freelifesm@yahoo.com' },
    { city: 'Satu Mare',             name: 'Asociația Urgențe 112 pentru Animale',              contact: '0261 824 271' },
    { city: 'Sfântu Gheorghe',       name: 'Asociația Nez Perce',                               contact: '0769 065 095 · nezperce@asociatianezperce.ro' },
    { city: 'Sibiu',                 name: 'Asociația Animal Life Sibiu',                       contact: '0741 188 934 · animallife@animallife.ro' },
    { city: 'Slatina',               name: 'Asociația Prietenii Noștri Slatina',                contact: 'ladysihera@yahoo.com' },
    { city: 'Slobozia',              name: 'Protecția Animalelor Ialomița',                     contact: 'Facebook: "Protecția Animalelor Ialomița"' },
    { city: 'Suceava',               name: 'Asociația Pro Anima Suceava',                       contact: 'proanima@hotmail.com' },
    { city: 'Târgoviște',            name: 'Asociația "Suflețel din Târgoviște"',               contact: '0727 494 424' },
    { city: 'Târgu Jiu',             name: 'Asociația Pro Animals Târgu Jiu',                   contact: '0722 225 388 · proanimals@proanimals.ro' },
    { city: 'Târgu Mureș',           name: 'Asociația RescueMe Târgu Mureș',                    contact: '0721 742 994 · office@rescueme.ro' },
    { city: 'Timișoara',             name: 'Animal Care Team (ACT)',                             contact: 'Facebook: Animal Care Team Timișoara' },
    { city: 'Timișoara',             name: 'Asociația Ecovet Timișoara',                        contact: '0724 346 123 · contact@ecovet.ro' },
    { city: 'Timișoara',             name: 'Asociația Pet Hope Timișoara',                      contact: '0754 032 534 · pethopetm@gmail.com' },
    { city: 'Tulcea',                name: 'Asociația "Binecuvântați Natura"',                  contact: '0722 288 222' },
    { city: 'Zalău',                 name: 'Protecția Animalelor Sălaj',                        contact: 'Facebook: "Protecția Animalelor Sălaj"' },
];

const STEPS = [
    {
        num:   '01',
        title: 'Stay calm',
        body:  'Don\'t chase the animal. Approach slowly and let it come to you.',
    },
    {
        num:   '02',
        title: 'Check for ID',
        body:  'Look for a collar or tag. If possible, take it to a vet to scan for a microchip.',
    },
    {
        num:   '03',
        title: 'Photograph and post',
        body:  'Take clear photos and upload immediately to Paws with the exact location.',
    },
    {
        num:   '04',
        title: 'Provide temporary care',
        body:  'If the animal is injured or it\'s cold, provide shelter while you wait for a response.',
    },
];

const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default function GuidePage() {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
            <Navbar />

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px', width: '100%', boxSizing: 'border-box' }}>

                {/* Dateline */}
                <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', textAlign: 'center', marginBottom: '12px' }}>
                    The Paws Daily · Field guide · {today}
                </div>

                {/* Title + subtitle */}
                <div style={{ fontFamily: serif, fontSize: '36px', fontWeight: 700, color: '#2D1F14', lineHeight: 1.05, textAlign: 'center', marginBottom: '10px' }}>
                    What to do when you find a stray
                </div>
                <div style={{ fontFamily: serif, fontSize: '15px', fontStyle: 'italic', color: '#7A5C44', textAlign: 'center', marginBottom: '32px' }}>
                    A quick guide for anyone who spots a stray animal.
                </div>

                {/* Divider */}
                <div style={{ borderTop: '3px double rgba(45,31,20,0.15)', marginBottom: '40px' }} />

                {/* Steps — flex row with vertical dividers */}
                <div style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>
                    {STEPS.map((step, i) => (
                        <React.Fragment key={step.num}>
                            <div style={{ flex: 1, padding: '28px 24px 28px 0', paddingLeft: i === 0 ? 0 : '24px' }}>
                                <div style={{ fontFamily: serif, fontSize: '48px', fontWeight: 700, color: 'rgba(45,31,20,0.08)', lineHeight: 1, width: '56px', flexShrink: 0, userSelect: 'none', marginBottom: '12px' }}>
                                    {step.num}
                                </div>
                                <div style={{ fontFamily: serif, fontSize: '18px', fontWeight: 700, color: '#2D1F14', marginBottom: '8px', lineHeight: 1.2 }}>
                                    {step.title}
                                </div>
                                <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>
                                    {step.body}
                                </div>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div style={{ width: '1px', backgroundColor: 'rgba(45,31,20,0.1)', alignSelf: 'stretch', flexShrink: 0 }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* ── Section A — Aggressive / scared animals ──────────── */}
                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', marginTop: '48px', paddingTop: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '8px', lineHeight: 1.2 }}>
                        If the animal is aggressive or scared
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7, marginBottom: '20px' }}>
                        Not all stray animals are approachable. If an animal seems aggressive, cornered, or severely injured, do not attempt to handle it yourself.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            'Call a local shelter for guidance. See the contacts list below',
                            'Do not block the animal\'s escape route because it may lash out if cornered',
                            'Take photos from a distance and post on Paws so others in the area are aware',
                        ].map((tip, i) => (
                            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#C07A4A', fontFamily: sans, fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>—</span>
                                <span style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7 }}>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Section B — Shelters across Romania ───────────────── */}
                <div style={{ borderTop: '1px solid rgba(45,31,20,0.1)', marginTop: '48px', paddingTop: '40px' }}>
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '6px', lineHeight: 1.2 }}>
                        Animal shelters across Romania
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '12px', color: '#B09880', marginBottom: '24px', lineHeight: 1.6 }}>
                        Asociații voluntare de protecție a animalelor, pe reședințe de județ. Datele de contact sunt preluate din surse publice și pot fi schimbate — verifică și pagina de Facebook a asociației dacă nu primești răspuns.
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        {SHELTERS.map(({ city, name, contact }, i) => (
                            <div key={`${city}-${i}`} style={{ borderLeft: '3px solid rgba(192,122,74,0.35)', paddingLeft: '14px', paddingTop: '2px', paddingBottom: '2px' }}>
                                <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C07A4A', fontWeight: 600, marginBottom: '2px' }}>
                                    {city}
                                </div>
                                <div style={{ fontFamily: serif, fontSize: '14px', fontWeight: 700, color: '#2D1F14', marginBottom: '3px', lineHeight: 1.2 }}>
                                    {name}
                                </div>
                                <div style={{ fontFamily: sans, fontSize: '11px', color: '#7A5C44' }}>
                                    {contact}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

                {/* ── Section C — CTA ───────────────────────────────────── */}
                <div style={{ borderTop: '3px double rgba(45,31,20,0.15)', marginTop: '56px', paddingTop: '40px', textAlign: 'center' }}>
                    <div style={{ fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: '#7A5C44', marginBottom: '20px', lineHeight: 1.5 }}>
                        "Every stray deserves a front page."
                    </div>
                    <Link
                        to="/add-animal"
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#C07A4A',
                            color: '#FAF7F4',
                            borderRadius: '100px',
                            padding: '12px 28px',
                            fontSize: '14px',
                            fontFamily: serif,
                            fontStyle: 'italic',
                            textDecoration: 'none',
                            transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#A8673C'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#C07A4A'; }}
                    >
                        Found a stray? Post it now →
                    </Link>
                </div>

            </div>
        </div>
    );
}
