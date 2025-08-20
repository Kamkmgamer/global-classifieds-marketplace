import '../../../test/jest-globals.d.ts';
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "../page";

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

describe("RegisterPage", () => {
  beforeEach(() => {
    push.mockReset();
    toast.mockReset();
    apiPost.mockReset();
  });

  it("registers successfully and redirects to /login", async () => {
    apiPost.mockResolvedValue({});

    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/password/i), "strongpass");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => expect(apiPost).toHaveBeenCalled());
    expect(push).toHaveBeenCalledWith("/login");
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringMatching(/registration successful/i) })
    );
  });

  it("shows error toast and message on failure", async () => {
    apiPost.mockRejectedValue(new Error("Email already in use"));

    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/email/i), "dup@example.com");
    await user.type(screen.getByLabelText(/password/i), "strongpass");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => expect(apiPost).toHaveBeenCalled());
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Error", description: "Email already in use" })
    );
    expect(await screen.findByText(/email already in use/i)).toBeInTheDocument();
  });
});
