/**
 * College Email Domain Configuration
 * 
 * Auto-verification for college/university email domains.
 * Users with emails from these domains are automatically verified.
 * 
 * Target: Kerala students (KTU, CUSAT, MG University, Calicut, Kerala University)
 * Also includes major Indian institutions for broader reach.
 */

// Kerala Universities and Colleges
const KERALA_DOMAINS = [
  // APJ Abdul Kalam Technological University (KTU) - Main
  'ktu.edu.in',
  
  // Cochin University of Science and Technology (CUSAT)
  'cusat.ac.in',
  'soe.cusat.ac.in',
  'dcs.cusat.ac.in',
  
  // Mahatma Gandhi University
  'mgu.ac.in',
  
  // University of Calicut
  'uoc.ac.in',
  
  // University of Kerala
  'keralauniversity.ac.in',
  
  // Kannur University
  'kannuruniversity.ac.in',
  
  // Kerala Agricultural University
  'kau.in',
  
  // National Institute of Technology Calicut
  'nitc.ac.in',
  
  // Indian Institute of Science Education and Research Thiruvananthapuram
  'iisertvm.ac.in',
  
  // Indian Institute of Technology Palakkad
  'iitpkd.ac.in',
  
  // Indian Institute of Management Kozhikode
  'iimk.ac.in',
  
  // Government Engineering Colleges
  'cet.ac.in',           // College of Engineering Trivandrum
  'gectcr.ac.in',        // GEC Thrissur
  'gecbh.ac.in',         // GEC Barton Hill
  'gecidukki.ac.in',     // GEC Idukki
  'gecskp.ac.in',        // GEC Sreekrishnapuram
  'geck.ac.in',          // GEC Kozhikode
  'gecw.ac.in',          // GEC Wayanad
  'gecpalakkad.ac.in',   // GEC Palakkad
  
  // Major Private Engineering Colleges (KTU affiliated)
  'mace.ac.in',          // Mar Athanasius College of Engineering
  'tkmce.ac.in',         // TKM College of Engineering
  'mbcet.ac.in',         // Mar Baselios College of Engineering
  'sctce.ac.in',         // SCT College of Engineering
  'vjcet.org',           // Viswajyothi College of Engineering
  'sjcetpalai.ac.in',    // St. Joseph's College of Engineering
  'fisat.ac.in',         // Federal Institute of Science and Technology
  'rajagiritech.edu.in', // Rajagiri School of Engineering
  'amaljyothi.ac.in',    // Amal Jyothi College of Engineering
  'mits.ac.in',          // Muthoot Institute of Technology
  'lbs.ac.in',           // LBS College of Engineering
  'vidyaacademy.ac.in',  // Vidya Academy of Science and Technology
  'sahrdaya.ac.in',      // Sahrdaya College of Engineering
  'saintgits.org',       // Saintgits College of Engineering
  'scmsgroup.org',       // SCMS School of Engineering
  'toch.ac.in',          // Toc H Institute of Science and Technology
  'jecc.ac.in',          // Jyothi Engineering College
  'mec.ac.in',           // Model Engineering College
  'nssce.ac.in',         // NSS College of Engineering
  'cethalassery.ac.in',  // College of Engineering Thalassery
  
  // Medical Colleges
  'gmctvm.gov.in',       // Government Medical College Trivandrum
  'aims.amrita.edu',     // Amrita Institute of Medical Sciences
  
  // Arts & Science Colleges
  'cukerala.ac.in',      // Central University of Kerala
]

// Major Indian Institutions (National reach)
const NATIONAL_DOMAINS = [
  // IITs
  'iitb.ac.in', 'iitd.ac.in', 'iitm.ac.in', 'iitk.ac.in', 'iitkgp.ac.in',
  'iith.ac.in', 'iitg.ac.in', 'iitr.ac.in', 'iitbbs.ac.in', 'iitmandi.ac.in',
  'iitj.ac.in', 'iitgoa.ac.in', 'iitdh.ac.in', 'iitbhilai.ac.in', 'iitp.ac.in',
  'iitrpr.ac.in',
  
  // NITs
  'nitt.edu', 'nitk.edu.in', 'nitw.ac.in', 'nits.ac.in', 'nitr.ac.in',
  'mnnit.ac.in', 'vnit.ac.in', 'svnit.ac.in', 'nitdgp.ac.in', 'nitj.ac.in',
  'nitrkl.ac.in', 'nita.ac.in', 'nitap.ac.in', 'nitgoa.ac.in', 'nitm.ac.in',
  'nitp.ac.in', 'nitpy.ac.in', 'nitsri.ac.in', 'nituk.ac.in', 'manit.ac.in',
  
  // IIITs
  'iiitd.ac.in', 'iiitb.ac.in', 'iiith.ac.in', 'iiita.ac.in', 'iiitdm.ac.in',
  'iiitdmj.ac.in', 'iiitk.ac.in', 'iiitl.ac.in', 'iiitn.ac.in', 'iiitm.ac.in',
  'iiitg.ac.in', 'iiitv.ac.in', 'iiitbh.ac.in', 'iiitdwd.ac.in', 'iiitkota.ac.in',
  'iiitranchi.ac.in', 'iiitsurat.ac.in', 'iiituna.ac.in', 'iiitsonepat.ac.in',
  'iiitkalyani.ac.in', 'iiitpune.ac.in', 'iiitbhopal.ac.in', 'iiitdharwad.ac.in',
  
  // BITS Pilani
  'bits-pilani.ac.in', 'pilani.bits-pilani.ac.in', 'goa.bits-pilani.ac.in',
  'hyderabad.bits-pilani.ac.in',
  
  // IISc and IISERs
  'iisc.ac.in', 'iiserbhopal.ac.in', 'iiserpune.ac.in', 'iisermohali.ac.in',
  'iiserkolkata.ac.in', 'iisertirupati.ac.in', 'iiserbpr.ac.in', 'niser.ac.in',
  
  // IIMs
  'iimb.ac.in', 'iima.ac.in', 'iimc.ac.in', 'iiml.ac.in', 'iimi.ac.in',
  'iimshillong.ac.in', 'iimraipur.ac.in', 'iimranchi.ac.in', 'iimkashipur.ac.in',
  'iimtrichy.ac.in', 'iimrohtak.ac.in', 'iimudaipur.ac.in', 'iimamritsar.ac.in',
  'iimbg.ac.in', 'iimj.ac.in', 'iimn.ac.in', 'iimsambalpur.ac.in', 'iimv.ac.in',
  
  // Central Universities
  'du.ac.in', 'jnu.ac.in', 'bhu.ac.in', 'amu.ac.in',
  
  // Other Major Institutions
  'dtu.ac.in', 'nsut.ac.in', 'igdtuw.ac.in', 'vit.ac.in', 'manipal.edu',
  'srmist.edu.in', 'thapar.edu', 'pec.edu.in', 'coep.org.in', 'vjti.ac.in',
  'ict.ac.in', 'isical.ac.in', 'xlri.ac.in', 'spjimr.org', 'fms.edu',
  'iift.edu', 'mdi.ac.in', 'ximb.ac.in', 'sibm.edu', 'nmims.edu',
  'christuniversity.in', 'snu.edu.in', 'ashoka.edu.in', 'flame.edu.in',
  'krea.edu.in', 'plaksha.edu.in',
]

// Generic educational TLDs (for broader coverage)
const EDUCATIONAL_TLDS = [
  '.edu.in',
  '.ac.in',
]

// Combine all verified domains
export const VERIFIED_COLLEGE_DOMAINS = [
  ...KERALA_DOMAINS,
  ...NATIONAL_DOMAINS,
]

/**
 * Check if an email domain is from a verified college
 */
export function isCollegeEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  
  const domain = email.toLowerCase().split('@')[1]
  if (!domain) return false
  
  // Check exact match first (most common case)
  if (VERIFIED_COLLEGE_DOMAINS.includes(domain)) {
    return true
  }
  
  // Check if domain ends with verified educational TLDs
  for (const tld of EDUCATIONAL_TLDS) {
    if (domain.endsWith(tld)) {
      return true
    }
  }
  
  return false
}

/**
 * Get verification status for an email
 */
export function getEmailVerificationStatus(email: string): {
  shouldAutoVerify: boolean
  isAdmin: boolean
  reason: string
} {
  const isCollege = isCollegeEmail(email)
  
  if (isCollege) {
    return {
      shouldAutoVerify: true,
      isAdmin: false,
      reason: 'Verified college/university email'
    }
  }
  
  return {
    shouldAutoVerify: false,
    isAdmin: false,
    reason: 'Non-institutional email - requires manual verification'
  }
}

/**
 * Get the institution name from email domain (for display purposes)
 */
export function getInstitutionFromEmail(email: string): string | null {
  if (!email) return null
  
  const domain = email.toLowerCase().split('@')[1]
  if (!domain) return null
  
  // Kerala institutions
  if (domain.includes('ktu')) return 'KTU'
  if (domain.includes('cusat')) return 'CUSAT'
  if (domain.includes('mgu')) return 'MG University'
  if (domain.includes('uoc')) return 'University of Calicut'
  if (domain.includes('keralauniversity')) return 'University of Kerala'
  if (domain.includes('nitc')) return 'NIT Calicut'
  if (domain.includes('iisertvm')) return 'IISER Thiruvananthapuram'
  if (domain.includes('iitpkd')) return 'IIT Palakkad'
  if (domain.includes('iimk')) return 'IIM Kozhikode'
  
  // National institutions
  if (domain.includes('iit')) return 'IIT'
  if (domain.includes('nit')) return 'NIT'
  if (domain.includes('iiit')) return 'IIIT'
  if (domain.includes('bits')) return 'BITS Pilani'
  if (domain.includes('iim')) return 'IIM'
  if (domain.includes('iisc')) return 'IISc'
  if (domain.includes('iiser')) return 'IISER'
  
  // Generic
  if (domain.endsWith('.edu.in') || domain.endsWith('.ac.in')) {
    return 'Verified Institution'
  }
  
  return null
}
