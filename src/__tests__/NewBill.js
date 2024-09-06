/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import mockStore from "../__mocks__/store"
import { localStorageMock } from "../__mocks__/localStorage.js"
import router from "../app/Router.js"

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  let onNavigate;

  beforeEach(() => {
    // Configurer le mock du localStorage
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))

    // Préparer la structure du DOM pour router
    document.body.innerHTML = '<div id="root"></div>'
    router()

    onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }
  })

  describe("When I am on NewBill Page", () => {
    test("Then the NewBill form should be displayed", () => {
      document.body.innerHTML = NewBillUI()  // Générer le DOM via NewBillUI
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()  // Vérifie que le formulaire est présent
    })
  })

  describe("When I upload a file with the wrong extension", () => {
    test("Then the file should not be accepted", () => {
      document.body.innerHTML = NewBillUI()  // Générer le DOM via NewBillUI

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      // Sélectionner l'input du fichier
      const fileInput = screen.getByTestId("file")
      expect(fileInput).toBeTruthy()  // Vérifier que l'input file est présent

      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      fileInput.addEventListener("change", handleChangeFile)

      // Simuler l'upload d'un fichier avec une mauvaise extension
      const file = new File(["test"], "test.txt", { type: "text/plain" })
      fireEvent.change(fileInput, { target: { files: [file] }})

      // Vérifier que le fichier est refusé
      expect(handleChangeFile).toHaveBeenCalled()
      expect(fileInput.value).toBe("")  // Le fichier ne doit pas être accepté
    })

    test("Then a valid file should be accepted", async () => {
      document.body.innerHTML = NewBillUI()  // Générer le DOM via NewBillUI

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      // Sélectionner l'input du fichier
      const fileInput = screen.getByTestId("file")
      expect(fileInput).toBeTruthy()  // Vérifier que l'input file est présent

      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      fileInput.addEventListener("change", handleChangeFile)

      // Simuler l'upload d'un fichier valide
      const file = new File(["image"], "test.jpg", { type: "image/jpeg" })
      fireEvent.change(fileInput, { target: { files: [file] }})

      expect(handleChangeFile).toHaveBeenCalled()
      expect(fileInput.files[0].name).toBe("test.jpg")  // Le fichier doit être accepté
    })
  })

  describe("When I submit a valid NewBill form", () => {
    test("Then the bill is submitted and I am redirected to Bills page", async () => {
      document.body.innerHTML = NewBillUI()  // Générer le DOM via NewBillUI

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      // Sélectionner le formulaire
      const form = screen.getByTestId("form-new-bill")
      expect(form).toBeTruthy()  // Vérifier que le formulaire est présent

      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)

      fireEvent.submit(form)

      // Vérifier que la fonction de soumission a été appelée
      expect(handleSubmit).toHaveBeenCalled()

      // Simuler la redirection après soumission
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()
    })
  })

  // Test d'intégration POST
  
})
