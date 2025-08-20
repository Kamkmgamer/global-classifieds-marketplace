import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FiltersBar from "../FiltersBar";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(""),
}));

// Mock shadcn/radix Select to a simple native <select>
jest.mock("@/components/ui/select", () => {
  const Select = ({ value, onValueChange }: { value: string; onValueChange?: (value: string) => void }) => (
    <select aria-label="Location" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      <option value="">All Locations</option>
      <option value="Tokyo">Tokyo</option>
      <option value="New York">New York</option>
      <option value="London">London</option>
    </select>
  );
  const SelectTrigger = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>;
  const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>;
  const SelectContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>;
  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

describe("FiltersBar", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("applies filters and resets page to 1", async () => {
    const user = userEvent.setup();
    render(<FiltersBar />);

    const min = screen.getByLabelText(/min price/i);
    const max = screen.getByLabelText(/max price/i);
    const locationSelect = screen.getByLabelText(/location/i);

    await user.clear(min);
    await user.type(min, "100");

    await user.clear(max);
    await user.type(max, "500");

    // Choose Tokyo in mocked native select
    await user.selectOptions(locationSelect, "Tokyo");

    const apply = screen.getByRole("button", { name: /apply/i });
    await user.click(apply);

    expect(push).toHaveBeenCalled();
    const url = push.mock.calls[0][0] as string;
    expect(url).toContain("/browse?");
    expect(url).toContain("minPrice=100");
    expect(url).toContain("maxPrice=500");
    expect(url).toContain("location=Tokyo");
    expect(url).toContain("page=1");
  });

  it("clears filters and removes related params", async () => {
    const user = userEvent.setup();
    render(<FiltersBar />);

    const clear = screen.getByRole("button", { name: /clear/i });
    await user.click(clear);

    expect(push).toHaveBeenCalled();
    const url = push.mock.calls[0][0] as string;
    expect(url).toContain("/browse");
    expect(url).not.toContain("minPrice=");
    expect(url).not.toContain("maxPrice=");
    expect(url).not.toContain("location=");
    expect(url).not.toContain("page=");
  });
});
