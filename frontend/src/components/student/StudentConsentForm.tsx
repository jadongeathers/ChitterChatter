import React from "react";

const StudentConsentForm: React.FC = () => {
  return (
    <div className="space-y-6 text-sm">
      <h2 className="text-xl font-semibold text-center">Student Consent Form</h2>
      
      <p>
        We are asking you to participate in a research study on exploring AI-powered virtual
        practice partners (VPPs) for language learning in classrooms. This study
        is being led by Jadon Geathers, Department of Information Science at Cornell
        University. The Faculty Advisors for this study are Rene Kizilcec and AJ Alvero,
        Department of Information Science at Cornell University.
      </p>
      
      <div>
        <h3 className="text-lg font-semibold">What the study is about</h3>
        <p>
          The purpose of this research is to explore how a Virtual Practice Partner (VPP), an
          AI-powered tool, can enhance language learning. The study aims to understand how
          the VPP supports students in practicing speaking, building confidence, and improving
          language proficiency, as well as how students interact with and perceive its usefulness.
        </p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Risks and discomforts</h3>
        <p>We do not anticipate any risks from participating in this research.</p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Benefits</h3>
        <p>
          Students may directly benefit from this study by improving their proficiency, comfort, and
          confidence in their target language through regular speaking practice and personalized
          feedback. Instructors may benefit by complementing their traditional teaching methods
          with assistive technology and offering students more accessible and flexible speaking
          opportunities. Additionally, the study aims to advance knowledge in designing
          educational technology that incorporates speech-to-speech models for language
          learning. Insights from this research may benefit future language learners by supporting
          the development of tools that make language education more accessible, engaging, and
          effective.
        </p>
      </div>
      
      
      <div>
        <h3 className="text-lg font-semibold">Privacy/Confidentiality/Data Security</h3>
        <p>
          Any data collected from surveys, interviews, and the Virtual Practice Partner (VPP) will
          be completely de-identified for research purposes. De-identified data means that all
          personally identifying information, such as names or contact details, will be removed or
          replaced with codes, ensuring that participants cannot be linked to their data.
        </p>
        <p className="mt-2">
          For instructional purposes, instructors will have access to aggregated and anonymized
          statistics about their students' engagement with the VPP. These statistics may include
          metrics such as the number of sessions completed, average session duration, and
          general progress trends. This information is provided to help instructors support their
          students more effectively, but no identifying information or detailed conversation logs will
          be shared with instructors.
        </p>
        <p className="mt-2">
          All data will be securely stored on encrypted, password-protected systems, compliant
          with institutional privacy and data security standards. Only authorized members of the
          research team will have access to identifying information, which will be stored
          separately from research data (e.g., signed consent forms). Sensitive data in an
          electronic environment will be encrypted during storage and transfer.
        </p>
        <p className="mt-2">
          We will do our best to keep your participation in this research study confidential to the
          extent permitted by law; however, it is possible that other people may need to review the
          research records and may find out about your participation in this study. For example,
          the following people/groups may check and copy records about this research:
        </p>
        <ul className="list-disc pl-5 mt-1">
          <li>The Office for Human Research Protections in the U. S. Department of Health
            and Human Services</li>
          <li>Cornell University's Institutional Review Board (a committee that reviews and
            approves research studies) and the Office for Research Integrity and Assurance</li>
        </ul>
        <p className="mt-2">
          We anticipate that your participation in this survey presents no greater risk than
          everyday use of the Internet. Data may exist on backups and server logs beyond the
          timeframe of this research project.
        </p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Sharing De-identified Data Collected in this Research</h3>
        <p>
          De-identified data from this study may be shared with the research community at large
          to advance science and health. We will remove or code any personal information that
          could identify you before files are shared with other researchers to ensure that, by
          current scientific standards and known methods, no one will be able to identify you from
          the information we share. Despite these measures, we cannot guarantee anonymity of
          your personal data.
        </p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Future use of Identifiable Data or Specimens Collected in this Research</h3>
        <p>
          Your information or biospecimens will not be used or distributed for future research
          studies.
        </p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Taking part is voluntary</h3>
        <p>
          Participation in this study is entirely voluntary. You may choose not to participate, refuse
          to answer any question, or stop participating at any time without penalty or negative
          consequences. Your decision to participate or withdraw will have no impact on your
          grades, academic standing, or relationship with your instructor, the university, or any
          other organization involved in this research.
        </p>
        <p className="mt-2">
          If you choose to withdraw, any data collected before your withdrawal will be used in the
          study only if it has been fully de-identified and cannot be linked to you. You will not be
          required to meet any specific participation thresholds (e.g., completing a set number of
          speaking sessions or surveys) to remain in the study, and you are free to skip any parts
          of the study that you find uncomfortable.
        </p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Follow up studies</h3>
        <p>
          We may contact you again to request your participation in a follow up study. As always,
          your participation will be voluntary and we will ask for your explicit consent to participate
          in any of the follow up studies.
        </p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">If you have questions</h3>
        <p>
          The main researcher conducting this study is Jadon Geathers, a PhD student at Cornell
          University. Please ask any questions you have now through email by contacting Jadon
          Geathers at <a href="mailto:jag569@cornell.edu" className="text-blue-600 underline">jag569@cornell.edu</a>. If you have questions later, you may contact Jadon
          Geathers at <a href="mailto:jag569@cornell.edu" className="text-blue-600 underline">jag569@cornell.edu</a>. If you have any questions or concerns regarding your
          rights as a subject in this study, you may contact the Institutional Review Board (IRB) for
          Human Participants at 607-255-6182 or access their website at
          <a href="https://researchservices.cornell.edu/offices/IRB" className="text-blue-600 underline ml-1">https://researchservices.cornell.edu/offices/IRB</a>. You may also report your concerns or
          complaints anonymously through Ethicspoint online at <a href="http://www.hotline.cornell.edu" className="text-blue-600 underline">www.hotline.cornell.edu</a> or by
          calling toll free at 1-866-293-3077. Ethicspoint is an independent organization that
          serves as a liaison between the University and the person bringing the complaint so that
          anonymity can be ensured.
        </p>
      </div>
      
      <div>
        <p>
          This consent form will be kept by the researcher for five years beyond the end of the
          study.
        </p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Statement of Consent</h3>
        <p>
          I have read the above information and have received answers to any questions I asked.
          I consent to take part in the study.
        </p>
      </div>
    </div>
  );
};

export default StudentConsentForm;