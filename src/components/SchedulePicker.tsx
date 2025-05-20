
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, set } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";

interface SchedulePickerProps {
  onScheduleChange: (scheduledAt: Date | null) => void;
}

export const SchedulePicker = ({ onScheduleChange }: SchedulePickerProps) => {
  const [date, setDate] = useState<Date | null>(null);
  const [hour, setHour] = useState<string>("12");
  const [minute, setMinute] = useState<string>("00");
  const [period, setPeriod] = useState<"AM" | "PM">("PM");
  const [isScheduled, setIsScheduled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
      setIsOpen(false);
    } else {
      setIsScheduled(true);
      setIsOpen(true);
      
      // Set default to tomorrow at noon
      const tomorrow = addDays(new Date(), 1);
      const defaultDate = set(tomorrow, { hours: 12, minutes: 0, seconds: 0 });
      setDate(defaultDate);
      setHour("12");
      setMinute("00");
      setPeriod("PM");
      onScheduleChange(defaultDate);
    }
  };

  const closePopover = () => {
    if (date) {
      setIsOpen(false);
    }
  };

  const handleQuickSchedule = (hours: number) => {
    const scheduledTime = addDays(new Date(), 0);
    scheduledTime.setHours(scheduledTime.getHours() + hours);
    scheduledTime.setMinutes(0);
    scheduledTime.setSeconds(0);
    
    setDate(scheduledTime);
    const is12Hour = scheduledTime.getHours() % 12;
    const isPM = scheduledTime.getHours() >= 12;
    
    setHour(is12Hour === 0 ? "12" : is12Hour.toString().padStart(2, '0'));
    setMinute("00");
    setPeriod(isPM ? "PM" : "AM");
    
    onScheduleChange(scheduledTime);
    setIsOpen(false);
    setIsScheduled(true);
  };

  return (
    <div className="relative">
      <Button 
        type="button" 
        variant={isScheduled ? "default" : "outline"}
        size="sm"
        className={isScheduled ? "bg-amber-500 hover:bg-amber-600" : ""}
        onClick={toggleSchedule}
      >
        <CalendarIcon className="h-4 w-4 mr-1" />
        {isScheduled ? "Scheduled" : "Schedule"}
      </Button>
      
      {isScheduled && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <span></span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              <div className="flex justify-between">
                <h4 className="font-semibold">Schedule Post</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setIsScheduled(false);
                    setDate(null);
                    onScheduleChange(null);
                    setIsOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleQuickSchedule(1)}
                >
                  In 1 hour
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleQuickSchedule(3)}
                >
                  In 3 hours
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleQuickSchedule(24)}
                >
                  Tomorrow
                </Button>
              </div>
              
              <Separator />
              
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                disabled={(date) => date < new Date()}
              />
              
              <div className="flex items-center space-x-2">
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
              
              <Button 
                onClick={closePopover} 
                disabled={!date} 
                className="w-full"
              >
                Set Schedule
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
