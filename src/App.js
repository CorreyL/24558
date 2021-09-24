import React, { useRef, useEffect, useState } from 'react';
import { saveAs } from 'file-saver';
import WebViewer from '@pdftron/webviewer';
import './App.css';

const App = () => {
  const viewer = useRef(null);
  const [wvInstance, setWvInstance] = useState(null);

  // if using a class, equivalent of componentDidMount 
  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        initialDoc: '/files/two-fields.pdf',
        fullAPI: true,
      },
      viewer.current,
    ).then((instance) => {
      setWvInstance(instance);

      instance.UI.VerificationOptions.addTrustedCertificates([
        '/pfx/pdftron.cer',
      ]);

      instance.Core.documentViewer.addEventListener('documentLoaded', () => {
        instance.UI.openElements(['signaturePanel']);
      });
    });
  }, []);

  const signAMField = async () => {
    const signFieldName = "AM";
    const getStepLevel = "AM";

    const am_in_approval_field_name = signFieldName;

    const am_in_private_key_file_path = "/pfx/pdftron.pfx";

    const am_in_keyfile_password = "password";

    const { PDFNet, documentViewer } = wvInstance.Core;
    await PDFNet.initialize();

    // Open an existing PDF
    const doc = await documentViewer.getDocument().getPDFDoc();

    const am_approvalSigField = await doc.getField(am_in_approval_field_name);
    const am_found_approvalSigField = await PDFNet.DigitalSignatureField.createFromField(
        am_approvalSigField
    );

    await am_found_approvalSigField.setDocumentPermissions(
        PDFNet.DigitalSignatureField.DocumentPermissions
            .e_annotating_formfilling_signing_allowed
    );

    await am_found_approvalSigField.signOnNextSaveFromURL(
        am_in_private_key_file_path,
        am_in_keyfile_password
    );

    // (OPTIONAL) Add more information to the signature dictionary.
    await am_found_approvalSigField.setLocation("Bangkok");
    await am_found_approvalSigField.setReason(
        "Document approval by " + signFieldName + "Role " + getStepLevel
    );
    await am_found_approvalSigField.setContactInfo("tony@pdftron.com");

    // The actual approval signing will be done during the save operation.
    const buf = await doc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_incremental);
    const blob = new Blob([buf], { type: "application/pdf" });
    saveAs(blob, 'AM-signed.pdf')

    documentViewer.loadDocument(blob, { extension: 'pdf' });
    // blobToBase64(tempBlob);

    // blobToBase64(blob);

    // setSignDigital(true);
  };

  const signMField = async () => {
    const signFieldName = "M";
    const getStepLevel = "M";
    const in_approval_field_name = signFieldName;

    // Open an existing PDF
    const in_private_key_file_path = "/pfx/pdftron.pfx";

    const in_keyfile_password = "password";

    const { PDFNet, documentViewer } = wvInstance.Core;
    await PDFNet.initialize();

    // Open an existing PDF
    const doc = await documentViewer.getDocument().getPDFDoc();

    const digSigFieldIterator = await doc.getDigitalSignatureFieldIteratorBegin();

    let foundOneDigSig = false;

    for (
        digSigFieldIterator;
        await digSigFieldIterator.hasNext();
        digSigFieldIterator.next()
    ) {
        const field = await digSigFieldIterator.current();
        if (await field.hasCryptographicSignature()) {
            foundOneDigSig = true;
            break;
        }
    }

    const approvalSigField = await doc.getField(in_approval_field_name);

    const found_approvalSigField = await PDFNet.DigitalSignatureField.createFromField(
      approvalSigField
    );

    if (!foundOneDigSig) {
      await found_approvalSigField.setDocumentPermissions(
        PDFNet.DigitalSignatureField.DocumentPermissions
          .e_annotating_formfilling_signing_allowed
      );
    }

    await found_approvalSigField.signOnNextSaveFromURL(
      in_private_key_file_path,
      in_keyfile_password
    );

    // (OPTIONAL) Add more information to the signature dictionary.
    await found_approvalSigField.setLocation("Bangkok");
    await found_approvalSigField.setReason(
        "Document approval by " + signFieldName + "Role " + getStepLevel
    );
    await found_approvalSigField.setContactInfo("panayu@pdftron.com");

    // The actual approval signing will be done during the save operation.
    const buf = await doc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_incremental);
    const blob = new Blob([buf], { type: "application/pdf" });
    saveAs(blob, 'M-signed.pdf');

    documentViewer.loadDocument(blob, { extension: 'pdf' });
    // blobToBase64(tempBlob);

    // blobToBase64(blob);

    // setSignDigital(true);
  };

  return (
    <div className="App">
      <div className="header">
        <button onClick={signAMField}>Sign AM Field</button>
        <button onClick={signMField}>Sign M Field</button>
      </div>
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default App;
