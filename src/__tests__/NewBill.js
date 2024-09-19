/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  let onNavigate;

  beforeEach(() => {
    // Configuration du mock du localStorage
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

    // Préparation de la structure du DOM pour le router
    document.body.innerHTML = '<div id="root"></div>';
    router();

    onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
  });

  describe("When I am on NewBill Page", () => {
    test("Then the NewBill form should be displayed", () => {
      document.body.innerHTML = NewBillUI();  // Générer le DOM via NewBillUI
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();  // Vérification de la présence du formulaire
    });
  });

  describe("When I upload a file with the wrong extension", () => {
    test("Then the file should not be accepted", () => {
      document.body.innerHTML = NewBillUI();  // Générer le DOM via NewBillUI

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      // Sélection de l'input du fichier
      const fileInput = screen.getByTestId("file");
      expect(fileInput).toBeTruthy();  // Vérification de la présence de l'input file

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      fileInput.addEventListener("change", handleChangeFile);

      // Simuler l'upload d'un fichier avec une mauvaise extension
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      fireEvent.change(fileInput, { target: { files: [file] }});

      // Vérifier que le fichier est refusé
      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.value).toBe("");  // Le fichier ne doit pas être accepté
    });

    test("Then a valid file should be accepted", async () => {
      document.body.innerHTML = NewBillUI();  // Générer le DOM via NewBillUI

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      // Sélection de l'input du fichier
      const fileInput = screen.getByTestId("file");
      expect(fileInput).toBeTruthy();  // Vérification de la présence de l'input file

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      fileInput.addEventListener("change", handleChangeFile);

      // Simuler l'upload d'un fichier valide
      const file = new File(["image"], "test.jpg", { type: "image/jpeg" });
      fireEvent.change(fileInput, { target: { files: [file] }});

      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).toBe("test.jpg");  // Le fichier doit être accepté
    });
  });

  describe("When I submit a valid NewBill form", () => {
    test("Then the bill is submitted and I am redirected to Bills page", async () => {
      document.body.innerHTML = NewBillUI();  // Générer le DOM via NewBillUI

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      // Sélection du formulaire
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();  // Vérification de la présence du formulaire

      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);

      // Vérification que la fonction de soumission a été appelée
      expect(handleSubmit).toHaveBeenCalled();

      // Simuler la redirection après soumission
      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });

  // Test d'intégration POST
  describe("When I submit a new bill", () => {
    test("Then a POST request is sent to the mock API", async () => {
      document.body.innerHTML = NewBillUI();  // Générer le DOM via NewBillUI

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,  // Utilisation du mockStore
        localStorage: window.localStorage
      });

      // Spy sur la méthode create de mockStore.bills
      const createSpy = jest.spyOn(mockStore.bills(), 'create');

      // Remplir le formulaire avec des données valides
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Vol Paris Londres" } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-09-15" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "348" } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("file"), {
        target: {
          files: [new File(["test"], "test.jpg", { type: "image/jpeg" })]
        }
      });

      // Simuler la soumission du formulaire
      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      // Vérification que la méthode create du mock a été appelée
      expect(createSpy).toHaveBeenCalled();

      // Simuler la redirection après soumission
      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
        document.body.innerHTML = NewBillUI();
      });

      test("Then it should handle 404 error from API", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 404"));
            }
          };
        });

        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
        const handleSubmit = jest.fn(newBill.handleSubmit);

        const form = screen.getByTestId('form-new-bill');
        form.addEventListener('submit', handleSubmit);

        fireEvent.submit(form);

        await new Promise(process.nextTick);

        expect(handleSubmit).toHaveBeenCalled();
        expect(mockStore.bills).toHaveBeenCalled();
        expect(mockStore.bills().create).toHaveBeenCalled();
      });

      test("Then it should handle 500 error from API", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 500"));
            }
          };
        });

        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
        const handleSubmit = jest.fn(newBill.handleSubmit);

        const form = screen.getByTestId('form-new-bill');
        form.addEventListener('submit', handleSubmit);

        fireEvent.submit(form);

        await new Promise(process.nextTick);

        expect(handleSubmit).toHaveBeenCalled();
        expect(mockStore.bills).toHaveBeenCalled();
        expect(mockStore.bills().create).toHaveBeenCalled();
      });
    });
  });
});
