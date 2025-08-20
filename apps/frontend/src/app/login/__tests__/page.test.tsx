import '../../../test/jest-globals.d.ts';
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../page";

const push = jest.fn();
const toast = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

const apiPost = jest.fn();
jest.mock("@/lib/http", () => ({
  api: { post: (...args: unknown[]) => apiPost(...args) },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    push.mockReset();
    toast.mockReset();
    apiPost.mockReset();
    // mock localStorage
    const setItem = jest.fn();
    Object.defineProperty(window, "localStorage", {
      value: { setItem },
      writable: true,
    });
    // reset cookie
    Object.defineProperty(document, "cookie", {
      value: "",
      writable: true,
    });
  });

  it("logs in successfully and navigates to /browse", async () => {
    apiPost.mockResolvedValue({ access_token: "token123" });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(apiPost).toHaveBeenCalled());
    expect(push).toHaveBeenCalledWith("/browse");
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringMatching(/login successful/i) })
    );
  });

  it("shows error toast and message on failure", async () => {
    apiPost.mockRejectedValue(new Error("Invalid credentials"));

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(apiPost).toHaveBeenCalled());
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Error", description: "Invalid credentials" })
    );
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
