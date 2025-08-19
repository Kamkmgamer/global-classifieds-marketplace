import { jest } from "@jest/globals";
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
  const React = require("react");
  const Select = ({ value, onValueChange, children }: any) => {
    // Flatten items from SelectContent
    const items: Array<{ value: string; label: string }> = [];
    React.Children.forEach(children, (child: any) => {
      if (!child) return;
      // Look into SelectContent children
      if (child.props && child.props.children) {
        React.Children.forEach(child.props.children, (grand: any) => {
          if (grand && grand.type && grand.props && grand.props.value) {
            items.push({ value: grand.props.value, label: grand.props.children });
          }
        });
      }
    });
    return (
      <select aria-label="Location" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
        {items.map((it) => (
          <option key={it.value} value={it.value}>
            {it.label}
          </option>
        ))}
      </select>
    );
  };
  const SelectTrigger = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>;
  const SelectContent = ({ children }: any) => <div>{children}</div>;
  const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>;
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
