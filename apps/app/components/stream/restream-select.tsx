import React, { useState, useEffect } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@repo/design-system/components/ui/table";

type DropdownItem = {
  service_name: string;
  value: string;
};

type SelectedItem = {
  service_name: string;
  value: string;
  url: string;
  stream_key: string;
};

type OutputStream = {
  url: string;
  stream_key: string;
  service_name: string;
};

type RestreamDropdownProps = {
  initialStreams?: OutputStream[] | [];
  onOutputStreamsChange: (fields: OutputStream[]) => void;
};

const RestreamDropdown = ({
  initialStreams,
  onOutputStreamsChange,
}: RestreamDropdownProps) => {
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([
    { service_name: "twitch", value: "Twitch" },
    { service_name: "twitter", value: "Twitter" },
    { service_name: "youtube", value: "YouTube" },
  ]);

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  useEffect(() => {
    if (!initialStreams || initialStreams.length === 0) return;
    // Initialize with existing streams
    const preselectedItems = initialStreams?.map(stream => ({
      service_name: stream.service_name.toLowerCase(),
      value: stream.service_name,
      url: stream.url,
      stream_key: stream.stream_key,
    }));
    setSelectedItems(preselectedItems);
    // Remove already selected items from dropdown
    setDropdownItems(prev =>
      prev.filter(
        item =>
          !preselectedItems.some(
            selected => selected.service_name === item.service_name,
          ),
      ),
    );
  }, []);

  const handleSelect = (service_name: string, value: string) => {
    const updatedSelectedItems = [
      ...selectedItems,
      { service_name, value, url: "", stream_key: "" },
    ];
    setSelectedItems(updatedSelectedItems);
    setDropdownItems(prev =>
      prev.filter(item => item.service_name !== service_name),
    );
    handleCallback(updatedSelectedItems);
  };

  const handleRemove = (service_name: string) => {
    const updatedSelectedItems = selectedItems.filter(
      item => item.service_name !== service_name,
    );
    const removedItem = selectedItems.find(
      item => item.service_name === service_name,
    );
    if (removedItem) {
      setDropdownItems(prev => [
        ...prev,
        { service_name: removedItem.service_name, value: removedItem.value },
      ]);
    }
    setSelectedItems(updatedSelectedItems);
    handleCallback(updatedSelectedItems);
  };

  const handleFieldChange = (
    key: string,
    field: "url" | "stream_key",
    value: string,
  ) => {
    const updatedSelectedItems = selectedItems.map(item =>
      item.service_name === key ? { ...item, [field]: value } : item,
    );
    setSelectedItems(updatedSelectedItems);
    handleCallback(updatedSelectedItems);
  };

  const handleCallback = (updatedItems: SelectedItem[]) => {
    //remove the value field from the object and pass it to the parent component
    onOutputStreamsChange(
      updatedItems.map(({ value, ...rest }) => ({ ...rest })),
    );
  };

  return (
    <div>
      <Select
        onValueChange={value => {
          const selectedItem = dropdownItems.find(
            item => item.service_name === value,
          );
          if (selectedItem) {
            handleSelect(selectedItem.service_name, selectedItem.value);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select an output stream target" />
        </SelectTrigger>
        <SelectContent>
          {dropdownItems.length === 0 && (
            <SelectItem key="no-options" value="no-options" disabled>
              No options available
            </SelectItem>
          )}
          {dropdownItems.map(item => (
            <SelectItem key={item.service_name} value={item.service_name}>
              {item.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedItems.length > 0 && (
        <Table className="mt-8">
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Stream URL</TableHead>
              <TableHead>Stream Key</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedItems.map(({ service_name, value, url, stream_key }) => (
              <TableRow key={service_name}>
                <TableCell>{value}</TableCell>
                <TableCell>
                  <Input
                    placeholder={`${value} Restream URL`}
                    value={url}
                    onChange={e =>
                      handleFieldChange(service_name, "url", e.target.value)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder={`${value} Stream Key`}
                    value={stream_key}
                    onChange={e =>
                      handleFieldChange(
                        service_name,
                        "stream_key",
                        e.target.value,
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    onClick={() => handleRemove(service_name)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default RestreamDropdown;
