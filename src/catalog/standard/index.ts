import { registerCatalog, type CatalogRegistry } from '../../a2ui/registry';
import { AudioPlayer } from './AudioPlayer';
import { Button } from './Button';
import { Card } from './Card';
import { CheckBox } from './CheckBox';
import { ChoicePicker } from './ChoicePicker';
import { DateTimeInput } from './DateTimeInput';
import { Icon } from './Icon';
import { Image } from './Image';
import { Column, Divider, List, Row } from './layout';
import { Modal } from './Modal';
import { Slider } from './Slider';
import { Tabs } from './Tabs';
import { Text } from './Text';
import { TextField } from './TextField';
import { Video } from './Video';

import { Badge } from './Badge';
import { BreakAlert } from './BreakAlert';
import { ForecastChart } from './ForecastChart';
import { Heading } from './Heading';
import { LineChart } from './LineChart';
import { LoanOffer } from './LoanOffer';
import { LoanSummary } from './LoanSummary';
import { LiabilitySummary } from './LiabilitySummary';
import { PlanTable } from './PlanTable';
import { ProgressBar } from './ProgressBar';
import { ScenarioComparison } from './ScenarioComparison';

/**
 * The default catalog — implements the full A2UI "basic" vocabulary
 * (https://a2ui.org basic/catalog.json) with our own React Native components,
 * no third-party UI library (INV-016). See MOBILE_ARCHITECTURE.md §4/§5.
 */
const standardCatalog: CatalogRegistry = {
  Text,
  Image,
  Icon,
  Video,
  AudioPlayer,
  Row,
  Column,
  List,
  Card,
  Tabs,
  Modal,
  Divider,
  Button,
  TextField,
  CheckBox,
  ChoicePicker,
  Slider,
  DateTimeInput,
  Heading,
  Badge,
  ProgressBar,
  LoanOffer,
  LoanSummary,
  LiabilitySummary,
  ScenarioComparison,
  PlanTable,
  ForecastChart,
  LineChart,
  BreakAlert,
};


registerCatalog('standard', standardCatalog);

export { standardCatalog };
