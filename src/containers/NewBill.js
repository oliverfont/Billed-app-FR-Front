import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    this.errorMessage = this.document.querySelector('.error-message')
    new Logout({ document, localStorage, onNavigate })
  }

  handleChangeFile = e => {
    e.preventDefault();
  
    // Récupérer le fichier téléchargé
    const file = e.target.files[0];
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];
  
    // Vérification de l'extension du fichier
    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    const fileExtension = fileName.split('.').pop().toLowerCase();
  
    if (!allowedExtensions.includes(fileExtension)) {
      this.errorMessage.textContent = 'Veuillez sélectionner un fichier au format .jpg, .jpeg ou .png.';  // Afficher le message d'erreur
      this.errorMessage.style.display = 'block';  // Rendre le message visible
      e.target.value = ''; // Réinitialiser le champ de fichier
      return;
    }
  
    // Cacher le message d'erreur si l'extension est correcte
    this.errorMessage.style.display = 'none';
    this.fileName = fileName;
    this.file = file;  // On stocke le fichier dans une variable pour plus tard
  };
  
  handleSubmit = e => {
    e.preventDefault();
  
    const email = JSON.parse(localStorage.getItem("user")).email;

    const formData = new FormData();
    formData.append('email', email);
    formData.append('type', e.target.querySelector(`select[data-testid="expense-type"]`).value);
    formData.append('name', e.target.querySelector(`input[data-testid="expense-name"]`).value);
    formData.append('amount', e.target.querySelector(`input[data-testid="amount"]`).value);
    formData.append('date', e.target.querySelector(`input[data-testid="datepicker"]`).value);
    formData.append('vat', e.target.querySelector(`input[data-testid="vat"]`).value);
    formData.append('pct', e.target.querySelector(`input[data-testid="pct"]`).value || 20);
    formData.append('commentary', e.target.querySelector(`textarea[data-testid="commentary"]`).value);
    formData.append('status', 'pending');
    
    if (this.file) {
      formData.append('file', this.file);
    }

    this.store.bills().create({
      data: formData,
      headers: {
        noContentType: true
      }
    })
    .then(() => {
      this.onNavigate(ROUTES_PATH['Bills']);
    })
    .catch(error => {
      console.error('Error while creating bill:', error);
    });
  };
  
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
}
