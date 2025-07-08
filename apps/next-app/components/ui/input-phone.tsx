"use client"

// Utilities
import { cn } from "@/lib/clsx-handler"

// React Hooks
import { useId, useState } from "react"

// Lucide Icons
import { ChevronDownIcon, PhoneIcon } from "lucide-react"

// React Phone Number Input
import * as RPNInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"

// UI Components
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function InputPhone({
  value,
  onChange,
  onBlur,
}: {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}) {
  const id = useId()

  return (
    <div className="*:not-first:mt-2" dir="ltr">
      <RPNInput.default
        className="flex rounded-md space-x-2"
        international
        flagComponent={FlagComponent}
        countrySelectComponent={CountrySelect}
        inputComponent={PhoneInput}
        id={id}
        placeholder="Enter phone number"
        value={value}
        onChange={(newValue) => onChange?.(newValue ?? "")}
        onBlur={onBlur}
        defaultCountry="US"
      />
    </div>
  )
}

const PhoneInput = ({ className, ...props }: React.ComponentProps<"input">) => {
  return (
    <Input
      data-slot="phone-input"
      className={cn(
        "-ms-px focus-visible:z-10",
        className
      )}
      {...props}
    />
  )
}

PhoneInput.displayName = "PhoneInput"

type CountrySelectProps = {
  disabled?: boolean
  value: RPNInput.Country
  onChange: (value: RPNInput.Country) => void
  options: { label: string; value: RPNInput.Country | undefined }[]
}

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
}: CountrySelectProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="border-input dark:bg-input/30 text-muted-foreground hover:cursor-pointer focus-within:border-ring focus-within:ring-ring/50 hover:bg-accent hover:text-foreground has-aria-invalid:border-destructive/60 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 relative inline-flex items-center self-stretch rounded-md border py-2 ps-3 pe-2 transition-[color] outline-none focus-within:z-10 focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50">
          <div className="inline-flex items-center gap-1" aria-hidden="true">
            <FlagComponent country={value} countryName={value} aria-hidden="true" />
            <span className="text-muted-foreground/80">
              <ChevronDownIcon size={16} aria-hidden="true" />
            </span>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter((x) => x.value)
                .map((option, i) => (
                  <CommandItem
                    key={option.value ?? `empty-${i}`}
                    value={`${option.value} ${option.label}`}
                    onSelect={() => {
                      if (option.value) {
                        onChange(option.value)
                        setOpen(false)
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <FlagComponent country={option.value!} countryName={option.value!} />
                      <span className="flex-1 truncate max-w-[20ch]">{option.label}</span>
                      {option.value && (
                        <span className="text-muted-foreground ml-auto">
                          +{RPNInput.getCountryCallingCode(option.value)}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country]

  return (
    <span className="w-5 overflow-hidden rounded-xs">
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <PhoneIcon size={16} aria-hidden="true" />
      )}
    </span>
  )
}