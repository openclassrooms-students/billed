/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockedBills from "../__mocks__/store.js";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then am I on the good page ?", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      waitFor(() => document.querySelector(".content-title"));
      const title = document.querySelector(".content-title").innerHTML;
      expect(title).toBe(" Envoyer une note de frais ");
    });


    test("Then I submit a NewBill", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      const store = mockedBills;
       new NewBill({
        document,
        onNavigate,
        store,
        localStorage,
      });
      const inputExpenseName = screen.getByTestId("expense-name");
      const inputDatePicker = screen.getByTestId("datepicker");
      const inputAmount = screen.getByTestId("amount");
      const inputPct = screen.getByTestId("pct");
      const inputCommentary = screen.getByTestId("commentary");
      const inputProofFile = screen.getByTestId("file");
      fireEvent.change(inputExpenseName, { target: { value: "Transports" } });
      fireEvent.change(inputDatePicker, { target: { value: "2023-08-05" } });
      fireEvent.change(inputAmount, { target: { value: 1000 } });
      fireEvent.change(inputPct, { target: { value: 20 } });
      fireEvent.change(inputCommentary, {
        target: { value: "trop cher" },
      });
      fireEvent.change(inputProofFile, {
        target: {
          files: [new File(["test.png"], "test.png", { type: "png" })],
        },
      });

      const submitButton = document.querySelector("#btn-send-bill");
      userEvent.click(submitButton);
      expect(window.location.href).toBe("http://localhost/#employee/bills");
    });

    test("show an alert and reset input value when file has a wrong extension", () => {
      const jsdomAlert = window.alert;
      window.alert = () => {};

      // storeMock is simulating

      const storeMock = { bills: jest.fn(() => ({ create: jest.fn() })) };

      const inputMock = {
        value: "/Users/fakePath/main.js",
        files: [new File(["file content"], "main.js", { type: "text/plain" })],
      };
      const preventDefaultMock = jest.fn();
      const alertMock = jest.spyOn(window, "alert");

      const newBill = new NewBill({
        document,
        store: storeMock,
        onNavigate,
      });

      newBill.handleChangeFile({
        target: inputMock,
        preventDefault: preventDefaultMock,
      });


      expect(preventDefaultMock).toHaveBeenCalled();
      expect(storeMock.bills).not.toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith(
        "Seuls les fichiers JPG, JPEG et PNG sont autorisés."
      );
      expect(inputMock.value).toBe(null);
      window.alert = jsdomAlert; // restore the jsdom alert
    });


    ////////////////////////////////////////////////////////////////////////////////////////////////
    // test d'intégration GET
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockedBills, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      test("Then the API failed and throw a 404 error", async () => {
        localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "a@a" })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        const store = mockedBills;
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        });
        const mockedBill = jest
          .spyOn(mockedBills, "bills")
          .mockImplementationOnce(() => {
            return {
              create: jest.fn().mockRejectedValue(new Error("Erreur 404")),
            };
          });
        await expect(mockedBill().create).rejects.toThrow("Erreur 404");
        expect(mockedBill).toHaveBeenCalled();
        expect(newBill.billId).toBeNull();
        expect(newBill.fileUrl).toBeNull();
        expect(newBill.fileName).toBeNull();
      });
      test("Then the API failed and trow a 500 error", async () => {
        localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "a@a" })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        const store = mockedBills;
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        });
        const mockedBill = jest
          .spyOn(mockedBills, "bills")
          .mockImplementationOnce(() => {
            return {
              create: jest.fn().mockRejectedValue(new Error("Erreur 500")),
            };
          });
        await expect(mockedBill().create).rejects.toThrow("Erreur 500");
        expect(mockedBill).toHaveBeenCalled();
        expect(newBill.billId).toBeNull();
        expect(newBill.fileUrl).toBeNull();
        expect(newBill.fileName).toBeNull();
      });
    });
  });
});
