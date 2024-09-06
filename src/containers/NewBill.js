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
      alert('Veuillez sélectionner un fichier au format .jpg, .jpeg ou .png.');
      e.target.value = ''; // Réinitialiser le champ de fichier
      return;
    }

    // Sauvegarder le fichier et le nom du fichier
    this.fileName = fileName;
    this.file = file;  // On stocke le fichier dans une variable pour plus tard
  };
  
  handleSubmit = e => {
    e.preventDefault();
  
    console.log('handleSubmit called');
  
    const email = JSON.parse(localStorage.getItem("user")).email;

    // Créer un FormData pour envoyer toutes les données en une seule requête
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
    
    // Ajouter le fichier au FormData
    if (this.file) {
      formData.append('file', this.file);
    }

    // Créer la note de frais avec les données et le fichier
    this.store.bills().create({
      data: formData,
      headers: {
        noContentType: true // Laisser le navigateur gérer Content-Type pour FormData
      }
    })
    .then(() => {
      console.log('Bill successfully created');
      this.onNavigate(ROUTES_PATH['Bills']);
    })
    .catch(error => {
      console.error('Error while creating bill:', error);
    });
  };
  
  // not need to cover this function by tests
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
