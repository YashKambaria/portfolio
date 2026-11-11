import { ArrowUpRight, Award, BookOpen, Code2, Github, Linkedin, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { achievements, developerTools, languages, profile, projects, skills } from '../../data/portfolio';
import styles from './PortfolioSections.module.css';

export function Capabilities() {
  return <section className="section-block" id="skills" data-scene="capabilities" aria-labelledby="skills-title"><div className="section-heading"><div><span className="eyebrow">TECHNICAL CAPABILITIES</span><h2 id="skills-title">Skills tied to systems, not score bars.</h2></div></div>
    <div className={styles.skillList}>{skills.map((skill, i) => <article className={styles.skillRow} key={skill.title}><span className={styles.skillIndex}>0{i + 1}</span><div className={styles.skillIntro}><h3>{skill.title}</h3><p>{skill.description}</p></div><div className={styles.evidenceList}>{skill.projects.map((evidence) => <p className={styles.projectRefs} key={evidence.slug}><Link to={`/projects/${evidence.slug}`}>{projects.find((p) => p.slug === evidence.slug)?.name}</Link><span>{evidence.technologies.join(' · ')}</span></p>)}</div></article>)}</div>
    <div className={styles.tools}><div><span className="eyebrow">LANGUAGES</span><p>{languages.join(' · ')}</p></div><div><span className="eyebrow">DEVELOPER TOOLS</span><p>{developerTools.join(' · ')}</p></div><div><span className="eyebrow">ADDITIONAL DATABASE SKILL</span><p>MySQL · listed in profile, not mapped to a featured repository</p></div></div>
  </section>;
}

export function CompetitiveProgramming() {
  return <section className={`${styles.competition} section-block`} data-scene="practice" aria-labelledby="leetcode-title"><div><span className="eyebrow">COMPETITIVE PROGRAMMING</span><h2 id="leetcode-title">Practice built through consistency.</h2><p>Resume-supplied profile figures; not live API statistics.</p><a className="button button-secondary" href={profile.socials.leetcode} target="_blank" rel="noreferrer">View LeetCode profile <ArrowUpRight size={16}/><span className="sr-only">(opens in a new tab)</span></a></div><div className={styles.statGrid}><div><strong>850+</strong><span>Problems solved</span></div><div><strong>Knight</strong><span>LeetCode badge</span></div><div><strong>1937</strong><span>Peak contest rating</span></div><div><strong>Top 3.69%</strong><span>Contest participants globally</span></div></div></section>;
}

export function AboutEducation() {
  return <section className={`${styles.about} section-block`} id="about" data-scene="about" aria-labelledby="about-title"><div><span className="eyebrow">ABOUT / EDUCATION</span><h2 id="about-title">Backend engineering is where product behavior meets system design.</h2><p>I’m Yash, a Computer Science Engineering student interested in backend engineering, service boundaries, data flow and infrastructure. I use project work to study the trade-offs behind how systems communicate and evolve.</p></div><aside className={styles.education}><BookOpen size={18} aria-hidden="true"/><span className="eyebrow">EDUCATION</span><h3>Nirma University</h3><p>B.Tech · Computer Science Engineering</p><p>August 2023 – August 2027</p><strong>CGPA 8.55 / 10</strong></aside></section>;
}

export function Achievements() {
  return <section className="section-block" id="achievements" data-scene="achievements" aria-labelledby="achievements-title"><div className="section-heading"><div><span className="eyebrow">ACHIEVEMENTS & LEARNING</span><h2 id="achievements-title">Recognition and continued study.</h2></div></div><div className={styles.achievementGrid}>{achievements.map((item, i) => <article className={styles.achievement} key={item.title}><span className={styles.achievementIcon} aria-hidden="true">{item.kind === 'Hackathon' ? <Trophy size={18}/> : <Award size={18}/>}</span><span className="eyebrow">{item.kind} · 0{i + 1}</span><h3>{item.title}</h3><p>{item.event}</p><small>{item.detail}</small></article>)}</div></section>;
}

export function Contact() {
  return <section className={`${styles.contact} section-block`} id="contact" data-scene="contact" aria-labelledby="contact-title"><div><span className="eyebrow">CONTACT</span><h2 id="contact-title">Let’s talk engineering.</h2><p>Find me on the professional platforms below.</p></div><div className={styles.socials}><a href={profile.socials.github} target="_blank" rel="noreferrer"><Github size={18}/> GitHub <ArrowUpRight size={15}/><span className="sr-only">(opens in a new tab)</span></a><a href={profile.socials.linkedin} target="_blank" rel="noreferrer"><Linkedin size={18}/> LinkedIn <ArrowUpRight size={15}/><span className="sr-only">(opens in a new tab)</span></a><a href={profile.socials.leetcode} target="_blank" rel="noreferrer"><Code2 size={18}/> LeetCode <ArrowUpRight size={15}/><span className="sr-only">(opens in a new tab)</span></a></div></section>;
}
