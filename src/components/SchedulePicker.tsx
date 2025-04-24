
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface SchedulePickerProps {
  onScheduleChange: (scheduledAt: Date | null) => void;
}

export const SchedulePicker = ({ onScheduleChange }: SchedulePickerProps) => {
  const [date, setDate] = useState<Date | null>(null);
  const [hour, setHour] = useState<string>("12");
  const [minute, setMinute] = useState<string>("00");
  const [period, setPeriod] = useState<"AM" | "PM">("PM");
  const [isScheduled, setIsScheduled] = useState(false);

  const handleDateSelect = (selectedDate: Date | null) => {
    setDate(selectedDate);
    
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      const hourValue = parseInt(hour);
      const hourIn24 = period === "PM" && hourValue < 12 ? hourValue + 12 : hourValue === 12 && period === "AM" ? 0 : hourValue;
      
      newDate.setHours(hourIn24, parseInt(minute));
      onScheduleChange(newDate);
    } else {
      onScheduleChange(null);
    }
  };

  const handleTimeChange = (type: "hour" | "minute" | "period", value: string) => {
    if (type === "hour") setHour(value);
    else if (type === "minute") setMinute(value);
    else setPeriod(value as "AM" | "PM");
    
    if (date) {
      const newDate = new Date(date);
      const hourValue = parseInt(type === "hour" ? value : hour);
      const periodValue = type === "period" ? value : period;
      const hourIn24 = periodValue === "PM" && hourValue < 12 ? hourValue + 12 : hourValue === 12 && periodValue === "AM" ? 0 : hourValue;
      
      newDate.setHours(hourIn24, parseInt(type === "minute" ? value : minute));
      onScheduleChange(newDate);
    }
  };

  const toggleSchedule = () => {
    if (isScheduled) {
      setIsScheduled(false);
      setDate(null);
      onScheduleChange(null);
    } else {
      setIsScheduled(true);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button 
        type="button" 
        variant={isScheduled ? "default" : "outline"}
        size="sm"
        onClick={toggleSchedule}
      >
        {isScheduled ? "Scheduled" : "Schedule"}
      </Button>
      
      {isScheduled && (
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select value={hour} onValueChange={(value) => handleTimeChange("hour", value)}>
              <SelectTrigger className="w-16">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({length: 12}, (_, i) => i + 1).map((h) => (
                  <SelectItem key={h} value={h.toString().padStart(2, '0')}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>:</span>
            <Select value={minute} onValueChange={(value) => handleTimeChange("minute", value)}>
              <SelectTrigger className="w-16">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({length: 12}, (_, i) => i * 5).map((m) => (
                  <SelectItem key={m} value={m.toString().padStart(2, '0')}>
                    {m.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(value) => handleTimeChange("period", value as "AM" | "PM")}>
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};
