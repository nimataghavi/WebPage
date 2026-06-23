const qr = new QRCodeStyling({
  width: 100,
  height: 100,
  type: 'svg',
  data: 'https://nima-taghavi.com',
  dotsOptions:          { color: '#4b28c0', type: 'rounded' },
  cornersSquareOptions: { color: '#6a3de8', type: 'extra-rounded' },
  cornersDotOptions:    { color: '#9b7ef8' },
  backgroundOptions:    { color: '#f7f5ff' },
  qrOptions:            { errorCorrectionLevel: 'Q' }
});
qr.append(document.getElementById('qr-canvas'));

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function copyEmail() {
  navigator.clipboard.writeText('nima.taghavi62@gmail.com')
    .then(() => showToast('Email copied to clipboard'))
    .catch(() => showToast('nima.taghavi62@gmail.com'));
}

function openLink(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function downloadVCard() {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:S. Nima Taghavi',
    'N:Taghavi;Nima;;S.;',
    'TITLE:Software Architect & Full Stack Developer',
    'ORG:Ati Sazan Ariayee Lotus',
    'EMAIL;TYPE=INTERNET:nima.taghavi62@gmail.com',
    'URL;TYPE=Website:https://nima-taghavi.com',
    'URL;TYPE=LinkedIn:https://www.linkedin.com/in/s-nima-taghavi',
    'URL;TYPE=GitHub:https://github.com/nimataghavi/',
    'NOTE:Software Architect\\, Full Stack .NET/Blazor Developer & IT Manager with 20+ years of experience.',
    'PHOTO;VALUE=URI:https://nima-taghavi.com/assets/img/NimaTaghavi.jpg',
    'END:VCARD'
  ].join('\r\n');

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'NimaTaghavi.vcf';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Contact saved — check your downloads');
}

function shareCard() {
  const shareData = {
    title: 'S. Nima Taghavi – Software Architect & Full Stack Developer',
    text: 'Software Architect, Full Stack .NET/Blazor Developer & IT Manager.',
    url: 'https://nima-taghavi.com/card'
  };
  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareData.url)
      .then(() => showToast('Link copied — share it anywhere!'))
      .catch(() => showToast('https://nima-taghavi.com/card'));
  }
}
